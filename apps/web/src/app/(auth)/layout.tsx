import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] flex items-center justify-center font-sans select-none antialiased">
            <div className="w-full max-w-md bg-[#12161a] border border-[#1f2630] rounded-lg p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#0ecb81] to-transparent" />
                {children}
            </div>
        </div>
    );
}