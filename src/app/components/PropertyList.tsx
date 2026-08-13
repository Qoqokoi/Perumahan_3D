import { Property } from '../App';
import { PropertyCard } from './PropertyCard';

interface PropertyListProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export function PropertyList({ properties, onSelectProperty }: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tidak ada properti yang ditemukan</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {properties.map(property => (
        <PropertyCard 
          key={property.id} 
          property={property}
          onClick={() => onSelectProperty(property)}
        />
      ))}
    </div>
  );
}
