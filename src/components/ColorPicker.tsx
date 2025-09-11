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

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#10b981',
  '#f97316', '#6366f1', '#84cc16', '#f43f5e',
  '#64748b', '#dc2626', '#7c3aed', '#059669',
  '#d97706', '#7c2d12', '#991b1b', '#1e40af'
];

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
        <PopoverContent className="w-80 bg-popover border-border" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Cores predefinidas</Label>
              <div className="grid grid-cols-10 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                      value === color 
                        ? 'border-foreground scale-110' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
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