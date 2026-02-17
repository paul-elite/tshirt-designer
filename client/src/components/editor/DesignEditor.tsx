import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';
import { designsApi } from '../../services/api';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertyPanel from './PropertyPanel';
import BottomBar from './BottomBar';
import AIPromptModal from './AIPromptModal';
import SaveDesignModal from './SaveDesignModal';

export default function DesignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    canvas,
    setDesignId,
    setDesignName,
    setIsDirty,
    resetEditor,
    frontCanvasData,
    backCanvasData,
  } = useEditorStore();

  const [showAIModal, setShowAIModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing design
  useEffect(() => {
    if (id && isAuthenticated) {
      loadDesign(id);
    }

    return () => {
      resetEditor();
    };
  }, [id, isAuthenticated]);

  const loadDesign = async (designId: string) => {
    setIsLoading(true);
    try {
      const response = await designsApi.getOne(designId);
      const design = response.data;

      setDesignId(design.id);
      setDesignName(design.name);

      if (canvas && design.canvasData) {
        const data = JSON.parse(design.canvasData);
        if (data.front) {
          useEditorStore.setState({ frontCanvasData: JSON.stringify(data.front) });
        }
        if (data.back) {
          useEditorStore.setState({ backCanvasData: JSON.stringify(data.back) });
        }
        // Load front view by default
        if (data.front) {
          canvas.loadFromJSON(data.front, () => {
            canvas.renderAll();
          });
        }
      }

      setIsDirty(false);
    } catch (error) {
      toast.error('Failed to load design');
      navigate('/design');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please login to save designs');
      navigate('/login', { state: { from: { pathname: '/design' } } });
      return;
    }
    setShowSaveModal(true);
  }, [isAuthenticated, navigate]);

  const handleAddToCart = useCallback(() => {
    if (!canvas) return;

    // Save current view first
    useEditorStore.getState().saveCurrentViewData();

    // Check if there's any design
    const objects = canvas.getObjects();
    if (objects.length === 0 && !frontCanvasData && !backCanvasData) {
      toast.error('Please add a design first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to add to cart');
      navigate('/login', { state: { from: { pathname: '/design' } } });
      return;
    }

    setShowSaveModal(true);
  }, [canvas, isAuthenticated, navigate, frontCanvasData, backCanvasData]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100">
      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <Toolbar onAIClick={() => setShowAIModal(true)} />

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <Canvas />
        </div>

        {/* Right Sidebar - Properties */}
        <PropertyPanel />
      </div>

      {/* Bottom Bar */}
      <BottomBar onSave={handleSave} onAddToCart={handleAddToCart} />

      {/* Modals */}
      <AIPromptModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
      <SaveDesignModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        addToCart={true}
      />
    </div>
  );
}
