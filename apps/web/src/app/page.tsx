export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
            <h1 className="text-6xl font-black tracking-tighter mb-4 graduate-text">
                SepeNatural <span className="text-emerald-500">2026</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md text-center mb-8">
                Metadata-driven ERP & Production Management Foundation Layer
            </p>
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-emerald-400 mb-1">API</h3>
                    <p className="text-xs text-slate-500">NestJS Foundation</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-blue-400 mb-1">Shared</h3>
                    <p className="text-xs text-slate-500">Type Contracts</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-purple-400 mb-1">ERP</h3>
                    <p className="text-xs text-slate-500">Netsis Integration</p>
                </div>
            </div>
        </div>
    );
}
