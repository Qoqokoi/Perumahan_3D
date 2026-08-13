import { Property } from '../App';
import { MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      house: 'Rumah',
      apartment: 'Apartemen',
      villa: 'Villa'
    };
    return labels[type] || type;
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <ImageWithFallback 
          src={property.image} 
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-blue-600">
          {getTypeLabel(property.type)}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2">{property.title}</h3>
        <p className="text-blue-600 mb-3">{formatPrice(property.price)}</p>
        
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <MapPin className="size-4" />
          <span className="text-sm">{property.location}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Bed className="size-4" />
            <span>{property.bedrooms} KT</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="size-4" />
            <span>{property.bathrooms} KM</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="size-4" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
