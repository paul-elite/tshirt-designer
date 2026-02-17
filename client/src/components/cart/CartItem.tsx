import { Trash2, Minus, Plus } from 'lucide-react';
import type { CartItem as CartItemType } from '../../types';
import { TSHIRT_STYLES, TSHIRT_MATERIALS } from '../../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity } = item;
  const design = product.design;

  const styleName = TSHIRT_STYLES.find((s) => s.value === product.style)?.label || product.style;
  const materialName = TSHIRT_MATERIALS.find((m) => m.value === product.material)?.label || product.material;

  return (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border">
      {/* Thumbnail */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {design?.thumbnailUrl ? (
          <img
            src={design.thumbnailUrl}
            alt={design.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{design?.name || 'Custom Design'}</h3>
        <div className="mt-1 text-sm text-gray-500 space-y-0.5">
          <p>
            Size: {product.size} | Color: {product.colorName}
          </p>
          <p>
            {styleName} | {materialName}
          </p>
          <p>Print: {product.printArea === 'both' ? 'Front & Back' : product.printArea}</p>
        </div>

        {/* Quantity and Price */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, quantity + 1)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-right">
            <p className="font-semibold text-gray-900">
              ${(product.pricePerUnit * quantity).toFixed(2)}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-gray-500">${product.pricePerUnit.toFixed(2)} each</p>
            )}
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
