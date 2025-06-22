import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { Monitor, Shield, Users, Headphones } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-green-600 p-12 flex-col justify-center">
        <div className="text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-3 rounded-xl">
              <Monitor className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">IT Helpdesk</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Streamline Your IT Support Experience
          </h2>
          
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Efficient ticket management, user administration, and seamless support workflows 
            all in one comprehensive platform.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure & Reliable</h3>
                <p className="text-blue-100">Enterprise-grade security with role-based access control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">User Management</h3>
                <p className="text-blue-100">Comprehensive user profiles and administrative controls</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">24/7 Support</h3>
                <p className="text-blue-100">Round-the-clock assistance for all your IT needs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">IT Helpdesk</h1>
            </div>
          </div>

          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}