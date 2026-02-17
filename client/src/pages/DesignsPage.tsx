import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palette, Plus, Edit3, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { designsApi } from '../services/api';
import Button from '../components/ui/Button';
import type { Design } from '../types';

export default function DesignsPage() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const response = await designsApi.getAll();
      setDesigns(response.data);
    } catch (error) {
      console.error('Failed to load designs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      await designsApi.delete(id);
      setDesigns(designs.filter((d) => d.id !== id));
      toast.success('Design deleted');
    } catch (error) {
      toast.error('Failed to delete design');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
        <Link to="/design">
          <Button leftIcon={<Plus className="h-5 w-5" />}>New Design</Button>
        </Link>
      </div>

      {designs.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No designs yet</h2>
          <p className="text-gray-600 mb-6">Create your first custom t-shirt design!</p>
          <Link to="/design">
            <Button>Start Designing</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div
              key={design.id}
              className="bg-white rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-100 relative">
                {design.thumbnailUrl ? (
                  <img
                    src={design.thumbnailUrl}
                    alt={design.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Palette className="h-12 w-12" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <button
                    onClick={() => navigate(`/design/${design.id}`)}
                    className="p-3 bg-white rounded-full text-gray-900 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(design.id)}
                    className="p-3 bg-white rounded-full text-red-600 hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Draft badge */}
                {design.isDraft && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                    Draft
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{design.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Updated {new Date(design.updatedAt).toLocaleDateString()}
                </p>

                <div className="mt-4 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/design/${design.id}`)}
                    leftIcon={<Edit3 className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/design/${design.id}`)}
                    leftIcon={<ShoppingCart className="h-4 w-4" />}
                  >
                    Order
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
