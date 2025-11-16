"use client"

import React from 'react'
import { BackgroundBeams } from '../ui/background-beams'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const LandingPage = () => {
  const router = useRouter();
  // Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleSignUp = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try{
      if (!role) {
        toast.error('Please select a role');
        return;
      }
      setIsLoading(true); 
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          first_name: firstName,
          last_name: lastName,
          role 
        }),
      });
      const data = await response.json();
      if(response.ok) {
        toast.success('Sign up successful');
        // Reset form
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');  
        setRole('');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Sign up failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }

  };

  const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoginLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword
        }),
      });
      const data = await response.json();
      if(response.ok) {
        toast.success('Login successful');
        // Reset form
        setLoginEmail('');
        setLoginPassword('');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center bg-black">
        <BackgroundBeams />
        <div className="z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl  font-bold  text-white mb-6 bg-clip-text text-transparent ">
            Clinic Management System
          </h1>
    
          <p className="text-base text-gray-400 leading-relaxed mb-6 max-w-2xl mx-auto">
            Experience seamless patient management, efficient appointment scheduling, and comprehensive 
            diagnostic tracking all in one intuitive platform. Our clinic management system empowers 
            healthcare professionals to focus on what matters most—providing exceptional patient care 
            while we handle the administrative complexities.
          </p>
          <div className="flex gap-4 justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Get Started</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-black border-gray-800 text-white">
                <form onSubmit={handleSignUp}>
                  <DialogHeader>
                    <DialogTitle className="text-white">Get Started</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create an account to access the platform.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="first-name" className="text-gray-200">First Name</Label>
                        <Input 
                          id="first-name" 
                          name="first_name" 
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name" 
                          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="last-name" className="text-gray-200">Last Name</Label>
                        <Input 
                          id="last-name" 
                          name="last_name" 
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name" 
                          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="email-1" className="text-gray-200">Email</Label>
                      <Input 
                        id="email-1" 
                        name="email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email" 
                        className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="password-1" className="text-gray-200">Password</Label>
                      <Input 
                        id="password-1" 
                        name="password" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password" 
                        className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="role" className="text-gray-200">Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger 
                          id="role"
                          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                        >
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" className="border-gray-900 bg-gray-600 hover:bg-gray-700 hover:text-white">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" className="bg-white/90 text-black hover:bg-white/80">
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>Log In</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-black border-gray-800 text-white">
                <form onSubmit={handleLogin}>
                  <DialogHeader>
                    <DialogTitle className="text-white">Welcome Back</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Log in to your account to continue.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-3">
                      <Label htmlFor="email-login" className="text-gray-200">Email</Label>
                      <Input 
                        id="email-login" 
                        name="email" 
                        type="email" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email" 
                        className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="password-login" className="text-gray-200">Password</Label>
                      <Input 
                        id="password-login" 
                        name="password" 
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password" 
                        className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button 
                        type="button"
                        variant="outline" 
                        className="border-gray-900 bg-gray-600 hover:bg-gray-700 hover:text-white"
                        disabled={isLoginLoading}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" className="bg-white/90 text-black hover:bg-white/80" disabled={isLoginLoading}>
                      {isLoginLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
              
        </div>
    </div>
  )
}

export default LandingPage

