import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useEditorStore } from '../../stores/editorStore';
import { useCartStore } from '../../stores/cartStore';
import { designsApi } from '../../services/api';

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  addToCart?: boolean;
}

export default function SaveDesignModal({ isOpen, onClose, addToCart = false }: SaveDesignModalProps) {
  const navigate = useNavigate();
  const {
    canvas,
    designId,
    designName,
    setDesignName,
    setDesignId,
    setIsDirty,
    saveCurrentViewData,
    frontCanvasData,
    backCanvasData,
    size,
    color,
    colorName,
    style,
    material,
    printArea,
    calculatePrice,
  } = useEditorStore();
  const { addToCart: addItemToCart } = useCartStore();

  const [name, setName] = useState(designName);
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!canvas) return;

    setIsSaving(true);

    try {
      // Save current view data first
      saveCurrentViewData();

      // Combine front and back canvas data
      const state = useEditorStore.getState();
      const canvasData = JSON.stringify({
        front: state.frontCanvasData ? JSON.parse(state.frontCanvasData) : canvas.toJSON(['id']),
        back: state.backCanvasData ? JSON.parse(state.backCanvasData) : null,
      });

      // Generate thumbnail
      const thumbnailUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.5,
      });

      let savedDesign;

      if (designId) {
        // Update existing design
        const response = await designsApi.update(designId, {
          name,
          canvasData,
          thumbnailUrl,
          isDraft: !addToCart,
        });
        savedDesign = response.data;
      } else {
        // Create new design
        const response = await designsApi.create({
          name,
          canvasData,
          thumbnailUrl,
          isDraft: !addToCart,
        });
        savedDesign = response.data;
        setDesignId(savedDesign.id);
      }

      setDesignName(name);
      setIsDirty(false);

      if (addToCart) {
        // Add to cart
        await addItemToCart({
          designId: savedDesign.id,
          designName: name,
          thumbnailUrl,
          canvasData,
          size,
          color,
          colorName,
          style,
          material,
          printArea,
          quantity,
          pricePerUnit: calculatePrice(),
        });

        toast.success('Added to cart!');
        onClose();
        navigate('/cart');
      } else {
        toast.success('Design saved!');
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={addToCart ? 'Save & Add to Cart' : 'Save Design'}
    >
      <div className="space-y-6">
        <Input
          label="Design Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Design"
        />

        {addToCart && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium">{size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color</span>
                  <span className="font-medium flex items-center">
                    <span
                      className="w-4 h-4 rounded-full mr-2 border"
                      style={{ backgroundColor: color }}
                    />
                    {colorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per shirt</span>
                  <span className="font-medium">${calculatePrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-900 font-medium">Total</span>
                  <span className="text-lg font-bold text-primary-600">
                    ${(calculatePrice() * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
            {addToCart ? 'Add to Cart' : 'Save Design'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
