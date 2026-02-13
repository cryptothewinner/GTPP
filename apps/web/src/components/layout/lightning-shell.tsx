'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Search,
    Bell,
    Settings,
    HelpCircle,
    LayoutDashboard,
    Package,
    Users,
    BarChart3,
    ChevronDown,
    Menu,
    Factory,
    BookOpen,
    FlaskConical,
    Layers,
    ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NavChild {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavItem {
    label: string;
    href?: string;
    icon: React.ReactNode;
    children?: NavChild[];
}

const navItems: NavItem[] = [
    {
        label: 'Başlangıç',
        href: '/',
        icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
        label: 'Üretim',
        icon: <Factory className="w-4 h-4" />,
        children: [
            { label: 'Üretim Planlama', href: '/production/planning', icon: <Factory className="w-4 h-4" /> },
            { label: 'Reçeteler', href: '/production/recipes', icon: <BookOpen className="w-4 h-4" /> },
            { label: 'Partiler', href: '/production/batches', icon: <FlaskConical className="w-4 h-4" /> },
        ],
    },
    {
        label: 'Malzemeler',
        icon: <Layers className="w-4 h-4" />,
        children: [
            { label: 'Malzemeler', href: '/materials/raw', icon: <Layers className="w-4 h-4" /> },
            { label: 'Ürün Listesi', href: '/materials/products', icon: <ShoppingBag className="w-4 h-4" /> },
            { label: 'Partiler', href: '/materials/batches', icon: <FlaskConical className="w-4 h-4" /> },
        ],
    },
    {
        label: 'Performans',
        href: '/performance',
        icon: <BarChart3 className="w-4 h-4" />,
    },
    {
        label: 'Envanter',
        href: '/inventory',
        icon: <Package className="w-4 h-4" />,
    },
    {
        label: 'Satışlar',
        href: '/sales',
        icon: <BarChart3 className="w-4 h-4" />,
    },
    {
        label: 'Müşteriler',
        href: '/customers',
        icon: <Users className="w-4 h-4" />,
    },
];

export function LightningShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const navRef = useRef<HTMLElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setOpenDropdown(null);
    }, [pathname]);

    const isItemActive = useCallback((item: NavItem): boolean => {
        if (item.href) {
            if (item.href === '/') return pathname === '/';
            return pathname.startsWith(item.href);
        }
        if (item.children) {
            return item.children.some((child) => pathname.startsWith(child.href));
        }
        return false;
    }, [pathname]);

    const handleTabClick = (item: NavItem) => {
        if (item.children) {
            setOpenDropdown(openDropdown === item.label ? null : item.label);
        } else if (item.href) {
            setOpenDropdown(null);
            router.push(item.href);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-lightning-gray">
            {/* Global Header */}
            <header className="h-14 bg-white border-b border-lightning-border flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 bg-lightning-blue rounded-md flex items-center justify-center text-white font-bold text-xl">
                            S
                        </div>
                        <span className="font-bold text-slate-800 hidden md:block">SepeNatural</span>
                    </div>

                    <div className="relative max-w-xl w-full hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Arama..."
                            className="pl-10 bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-lightning-blue h-8 rounded-md transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-lightning-blue">
                        <HelpCircle className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-lightning-blue">
                        <Settings className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-lightning-blue relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                    </Button>
                    <div className="ml-2 pl-2 border-l border-lightning-border flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            SN
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </header>

            {/* Navigation Tabs Bar */}
            <nav ref={navRef} className="bg-[#f3f3f3] border-b border-lightning-border px-4 relative">
                <div className="flex items-center gap-1 overflow-x-auto">
                    <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
                        <Menu className="w-5 h-5" />
                    </Button>
                    {navItems.map((item) => {
                        const isActive = isItemActive(item);
                        const hasChildren = !!item.children;
                        const isOpen = openDropdown === item.label;

                        if (hasChildren) {
                            return (
                                <div key={item.label} className="relative">
                                    <button
                                        onClick={() => handleTabClick(item)}
                                        className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${isActive
                                            ? 'text-lightning-blue border-lightning-blue bg-white shadow-[0_-2px_0_inset_#0176D3]'
                                            : 'text-slate-600 border-transparent hover:bg-white/50'
                                            }`}
                                    >
                                        <span className={isActive ? 'text-lightning-blue' : 'text-slate-400'}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''
                                                } ${isActive ? 'text-lightning-blue' : 'text-slate-400'}`}
                                        />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all shrink-0 ${isActive
                                    ? 'text-lightning-blue border-lightning-blue bg-white shadow-[0_-2px_0_inset_#0176D3]'
                                    : 'text-slate-600 border-transparent hover:bg-white/50'
                                    }`}
                            >
                                <span className={isActive ? 'text-lightning-blue' : 'text-slate-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Dropdown Panels */}
                {navItems.map((item) => {
                    if (!item.children || openDropdown !== item.label) return null;
                    return (
                        <div
                            key={item.label}
                            className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-lg z-40"
                        >
                            <div className="flex items-center gap-1 px-4 py-2">
                                {item.children.map((child) => {
                                    const isChildActive = pathname.startsWith(child.href);
                                    return (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-md transition-all ${isChildActive
                                                ? 'text-lightning-blue bg-blue-50'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                        >
                                            <span className={isChildActive ? 'text-lightning-blue' : 'text-slate-400'}>
                                                {child.icon}
                                            </span>
                                            {child.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
