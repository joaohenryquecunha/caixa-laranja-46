import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// Cores base com diferentes tons
const COLOR_PALETTE = {
  red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  orange: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
  amber: ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  yellow: ['#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12'],
  lime: ['#f7fee7', '#ecfccb', '#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f', '#365314', '#1a2e05'],
  green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
  emerald: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  teal: ['#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'],
  cyan: ['#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
  sky: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'],
  blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  indigo: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
  violet: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
  purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87'],
  fuchsia: ['#fdf4ff', '#fae8ff', '#f5d0fe', '#f0abfc', '#e879f9', '#d946ef', '#c026d3', '#a21caf', '#86198f', '#701a75'],
  pink: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
  rose: ['#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'],
  gray: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827'],
  slate: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a']
};

export function ColorPicker({ value, onChange, label = "Cor" }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const [open, setOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setOpen(false);
  };

  const handleCustomColorSubmit = () => {
    if (customColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColor)) {
      onChange(customColor);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-input border-border"
          >
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: value }}
            />
            <Palette className="h-4 w-4" />
            Selecionar cor
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 bg-popover border-border" align="start">
          <div className="space-y-4 max-h-80 overflow-y-auto">
            <div>
              <Label className="text-sm font-medium mb-3 block">Paleta de Cores</Label>
              <div className="space-y-3">
                {Object.entries(COLOR_PALETTE).map(([colorName, shades]) => (
                  <div key={colorName} className="space-y-1">
                    <p className="text-xs text-muted-foreground capitalize font-medium">
                      {colorName === 'gray' ? 'Cinza' :
                       colorName === 'slate' ? 'Ardósia' :
                       colorName === 'red' ? 'Vermelho' :
                       colorName === 'orange' ? 'Laranja' :
                       colorName === 'amber' ? 'Âmbar' :
                       colorName === 'yellow' ? 'Amarelo' :
                       colorName === 'lime' ? 'Lima' :
                       colorName === 'green' ? 'Verde' :
                       colorName === 'emerald' ? 'Esmeralda' :
                       colorName === 'teal' ? 'Cerceta' :
                       colorName === 'cyan' ? 'Ciano' :
                       colorName === 'sky' ? 'Céu' :
                       colorName === 'blue' ? 'Azul' :
                       colorName === 'indigo' ? 'Índigo' :
                       colorName === 'violet' ? 'Violeta' :
                       colorName === 'purple' ? 'Roxo' :
                       colorName === 'fuchsia' ? 'Fúcsia' :
                       colorName === 'pink' ? 'Rosa' :
                       colorName === 'rose' ? 'Rosa' : colorName}
                    </p>
                    <div className="flex gap-1">
                      {shades.map((shade, index) => (
                        <button
                          key={shade}
                          type="button"
                          className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 hover:shadow-lg ${
                            value === shade 
                              ? 'border-foreground scale-110 shadow-lg' 
                              : 'border-transparent hover:border-muted-foreground'
                          }`}
                          style={{ backgroundColor: shade }}
                          onClick={() => handleColorSelect(shade)}
                          title={`${colorName} - Tom ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-border pt-4 space-y-2">
              <Label className="text-sm font-medium">Cor personalizada</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="#ff0000"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="bg-input border-border text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomColorSubmit}
                  disabled={!customColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customColor)}
                >
                  OK
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use formato hexadecimal (ex: #ff0000)
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}