'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError(res.error);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('Identity validation authentication failure.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-center">
                <h1 className="text-xl font-bold text-white tracking-tight">Exchange</h1>
                <p className="text-xs text-[#707a8a] mt-1">Welcome back to Exchange</p>
            </div>

            {error && (
                <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 text-[#f6465d] p-2.5 rounded text-[11px] font-mono">
                    Auth Failure: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] text-[#707a8a] uppercase font-bold tracking-wider">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#161a1e] border border-[#2b3139] rounded p-2 text-xs text-[#eaecef] outline-none focus:border-[#475262]"
                        placeholder="name@domain.com"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-[#707a8a] uppercase font-bold tracking-wider">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#161a1e] border border-[#2b3139] rounded p-2 text-xs text-[#eaecef] outline-none focus:border-[#475262]"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded bg-[#0ecb81] hover:bg-[#0bba74] text-[#0b0e11] font-bold text-xs shadow transition-all disabled:opacity-40"
                >
                    {loading ? 'Authenticating Profile...' : 'Sign In'}
                </button>
            </form>

            <div className="text-center pt-2 border-t border-[#1f2630]/60 text-[11px] text-[#848e9c]">
                Don&apos;t have an Account?{' '}
                <Link href="/signup" className="text-[#0ecb81] font-semibold hover:underline">
                    Create Account
                </Link>
            </div>
        </div>
    );
}