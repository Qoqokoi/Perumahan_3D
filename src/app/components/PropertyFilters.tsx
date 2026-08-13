import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Button } from './ui/button';

interface PropertyFiltersProps {
  onFilterChange: (filters: {
    priceRange?: [number, number];
    propertyType?: string;
    minBedrooms?: number;
  }) => void;
}

export function PropertyFilters({ onFilterChange }: PropertyFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000000]);
  const [propertyType, setPropertyType] = useState('all');
  const [minBedrooms, setMinBedrooms] = useState<number>(0);

  const handleApplyFilters = () => {
    onFilterChange({
      priceRange: priceRange[0] === 0 && priceRange[1] === 10000000000 ? undefined : priceRange,
      propertyType: propertyType === 'all' ? undefined : propertyType,
      minBedrooms: minBedrooms === 0 ? undefined : minBedrooms
    });
  };

  const handleReset = () => {
    setPriceRange([0, 10000000000]);
    setPropertyType('all');
    setMinBedrooms(0);
    onFilterChange({});
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)}M`;
    }
    return `${(price / 1000000).toFixed(0)}jt`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Pencarian</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Type */}
        <div className="space-y-2">
          <Label>Tipe Properti</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="house">Rumah</SelectItem>
              <SelectItem value="apartment">Apartemen</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Rentang Harga</Label>
          <div className="pt-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              min={0}
              max={10000000000}
              step={100000000}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Rp {formatPrice(priceRange[0])}</span>
            <span>Rp {formatPrice(priceRange[1])}</span>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-2">
          <Label>Minimal Kamar Tidur</Label>
          <Select value={minBedrooms.toString()} onValueChange={(v) => setMinBedrooms(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Semua</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button onClick={handleApplyFilters} className="w-full">
            Terapkan Filter
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Reset Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
