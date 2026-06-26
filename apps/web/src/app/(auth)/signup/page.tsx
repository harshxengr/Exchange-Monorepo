'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed.');
            }

            router.push('/signin');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Internal registration execution failure.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="text-center">
                <h1 className="text-xl font-bold text-white tracking-tight">Exchange</h1>
                <p className="text-xs text-[#707a8a] mt-1">Create a free account</p>
            </div>

            {error && (
                <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 text-[#f6465d] p-2.5 rounded text-[11px] font-mono">
                    Registration Error: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] text-[#707a8a] uppercase font-bold tracking-wider">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#161a1e] border border-[#2b3139] rounded p-2 text-xs text-[#eaecef] outline-none focus:border-[#475262]"
                        placeholder="name"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-[#707a8a] uppercase font-bold tracking-wider">Email address</label>
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
                    {loading ? 'Registering New Account...' : 'Register New profile'}
                </button>
            </form>

            <div className="text-center pt-2 border-t border-[#1f2630]/60 text-[11px] text-[#848e9c]">
                Already have an account?{' '}
                <Link href="/signin" className="text-[#0ecb81] font-semibold hover:underline">
                    Sign In
                </Link>
            </div>
        </div>
    );
}