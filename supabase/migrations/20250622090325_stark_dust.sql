/*
  # User Management and Security Functions

  1. Security Functions
    - `delete_user_account()` - Allow admins to delete user accounts
    - `prevent_self_role_assignment()` - Prevent users from changing their own roles
    - `change_user_password()` - Password change helper function

  2. Triggers
    - Trigger to prevent self-role assignment on user_profiles

  3. RLS Policies
    - Updated policies for user_profiles table with admin controls
    - Separate policies for viewing, updating, and managing profiles

  4. Permissions
    - Grant execute permissions on functions to authenticated users
*/

-- First, ensure user_profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'hr_manager', 'it_manager', 'manager', 'employee', 'user')),
  department text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Add function to allow admins to delete user accounts
CREATE OR REPLACE FUNCTION delete_user_account(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM user_profiles 
  WHERE user_id = auth.uid();

  -- Check if the current user is an admin
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete user accounts';
  END IF;

  -- Prevent admins from deleting themselves
  IF user_id_to_delete = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Delete HR staff record if exists (check if table exists first)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hr_staff_records') THEN
    DELETE FROM hr_staff_records WHERE user_id = user_id_to_delete;
  END IF;
  
  -- Delete any tickets assigned to this user (check if table exists first)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
    UPDATE tickets SET assigned_to = NULL WHERE assigned_to = user_id_to_delete;
  END IF;
  
  -- Delete the user profile
  DELETE FROM user_profiles WHERE user_id = user_id_to_delete;
  
  -- Note: The actual auth.users record deletion should be handled by Supabase Auth
  -- This function handles the related data cleanup
END;
$$;

-- Update user_profiles table to prevent self-role assignment
CREATE OR REPLACE FUNCTION prevent_self_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Allow initial role assignment during user creation
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- For updates, check if user is trying to change their own role
  IF TG_OP = 'UPDATE' AND OLD.user_id = auth.uid() AND OLD.role != NEW.role THEN
    -- Get the current user's role
    SELECT role INTO current_user_role
    FROM user_profiles 
    WHERE user_id = auth.uid();
    
    -- Only allow if another admin is making the change (not self-change)
    IF current_user_role != 'admin' OR OLD.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot change their own role. Contact an administrator.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to prevent self-role assignment
DROP TRIGGER IF EXISTS prevent_self_role_assignment_trigger ON user_profiles;
CREATE TRIGGER prevent_self_role_assignment_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_role_assignment();

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON user_profiles;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile (non-role fields)"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND (
      -- Allow non-role updates
      role = (SELECT role FROM user_profiles WHERE user_id = auth.uid())
      OR
      -- Allow if user is admin updating someone else
      EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid() 
        AND up.role = 'admin'
        AND user_profiles.user_id != auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Allow profile creation during signup"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to change user password (helper for frontend)
CREATE OR REPLACE FUNCTION change_user_password(new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be used with Supabase Auth API
  -- The actual password change is handled by Supabase Auth
  -- This is a placeholder for any additional logic needed
  
  RETURN json_build_object(
    'success', true,
    'message', 'Password change initiated. Use Supabase Auth API for actual password update.'
  );
END;
$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at trigger to user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_self_role_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- Ensure proper table permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT DELETE ON user_profiles TO authenticated; -- Only admins can actually delete via RLS