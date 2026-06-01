import { Palette } from 'lucide-react';
import React from 'react';
import { useVisualSettingsStore } from '../stores/visualSettingsStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ThemeSelector } from './ui/ThemeSelector';

interface VisualSettingsProps {
  className?: string;
}

const VisualSettings: React.FC<VisualSettingsProps> = ({ className }) => {
  const {
    spacing,
    fontSize,
    visualEffects,
    setSpacing,
    setFontSize,
    setVisualEffects,
  } = useVisualSettingsStore();

  return (
    <div className={className}>
      <div className="grid gap-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-xs text-primary">
              <Palette className="w-5 h-5" />
              Visual Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-xl">
            {/* Theme and Spacing Setting */}
            <div className="space-y-sm">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">
                THEME & SPACING
              </Label>
              <div className="flex flex-col sm:flex-row gap-md">
                <div className="flex-1">
                  <ThemeSelector
                    variant="buttons"
                    showDescription={false}
                    className="justify-start"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={spacing === 'comfortable' ? 'outline' : 'ghost'}
                    onClick={() => setSpacing('comfortable')}
                    size="sm"
                    className="px-2 py-1 text-xs"
                  >
                    Comfortable
                  </Button>
                  <Button
                    variant={spacing === 'compact' ? 'outline' : 'ghost'}
                    onClick={() => setSpacing('compact')}
                    size="sm"
                    className="px-2 py-1 text-xs"
                  >
                    Compact
                  </Button>
                </div>
              </div>
            </div>

            {/* Font Size Setting */}
            <div className="space-y-sm">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider">
                FONT SIZE
              </Label>
              <div className="flex items-center gap-md">
                <Input
                  type="number"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  px (10-24 range)
                </span>
                <div className="flex gap-xs ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                    disabled={fontSize <= 10}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                    disabled={fontSize >= 24}
                  >
                    +
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                All font sizes are relative to this base size
              </p>
            </div>

            {/* Visual Effects Setting */}
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground uppercase text-xs tracking-wider">
                    VISUAL EFFECTS
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls blur effects, transparencies, and advanced CSS that
                    might impact performance
                  </p>
                </div>
                <Switch
                  checked={visualEffects}
                  onCheckedChange={setVisualEffects}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisualSettings;
