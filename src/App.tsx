import { useState } from 'react';
import { LayoutDashboard, PieChart, Plus, Wallet, Trash2, LogOut } from 'lucide-react';
import { usePortfolio } from './hooks/usePortfolio';
import { AssetList } from './components/AssetList';
import { AssetForm } from './components/AssetForm';
import { AllocationChart } from './components/AllocationChart';
import { RebalanceCalculator } from './components/RebalanceCalculator';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { auth } from './lib/firebase';
import type { Asset } from './types';

function Dashboard() {
  const {
    assets,
    portfolios,
    activePortfolioId,
    setActivePortfolioId,
    createPortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    removeAsset,
    loading
  } = usePortfolio();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const handleAddAsset = (asset: Asset) => {
    if (editingAsset) {
      updateAsset(asset.id, asset);
    } else {
      addAsset(asset);
    }
    setEditingAsset(null);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPortfolioName.trim()) {
      createPortfolio(newPortfolioName.trim());
      setNewPortfolioName('');
      setIsCreatingPortfolio(false);
    }
  };

  const totalValue = assets.reduce((sum: number, asset: Asset) => sum + (asset.value || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Crypto Portfolio Manager
          </h1>
          <p className="text-slate-400 mt-1">Track and rebalance your crypto assets</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative group">
            <select
              value={activePortfolioId}
              onChange={(e) => setActivePortfolioId(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer min-w-[200px]"
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Wallet className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsCreatingPortfolio(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Create New Portfolio"
          >
            <Plus className="w-5 h-5" />
          </button>

          {portfolios.length > 1 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this portfolio?')) {
                  deletePortfolio(activePortfolioId);
                }
              }}
              className="p-2 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              title="Delete Portfolio"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Asset
          </button>

          <button
            onClick={() => auth.signOut()}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
              Total Value
            </h2>
            <p className="text-3xl font-mono font-bold text-white">
              ${totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Allocation
            </h2>
            <AllocationChart assets={assets} />
          </div>
        </div>

        <RebalanceCalculator assets={assets} totalValue={totalValue} />

        <AssetList
          assets={assets}
          onRemove={removeAsset}
          onEdit={handleEditAsset}
        />
      </main>

      <AssetForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleAddAsset}
        initialData={editingAsset}
      />

      {isCreatingPortfolio && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Create Portfolio</h2>
            <form onSubmit={handleCreatePortfolio}>
              <input
                type="text"
                autoFocus
                placeholder="Portfolio Name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newPortfolioName}
                onChange={e => setNewPortfolioName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPortfolio(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPortfolioName.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
