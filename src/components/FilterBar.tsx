import type { PlayerFilters } from '../types';

interface FilterBarProps {
  filters: PlayerFilters;
  onFilterChange: (filters: PlayerFilters) => void;
  teams: string[];
  positions: string[];
}

export default function FilterBar({ filters, onFilterChange, teams, positions }: FilterBarProps) {
  const handleChange = (field: keyof PlayerFilters, value: string | number) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search players..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Team
          </label>
          <select
            id="team-filter"
            value={filters.team}
            onChange={(e) => handleChange('team', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="position-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <select
            id="position-filter"
            value={filters.position}
            onChange={(e) => handleChange('position', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Positions</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="min-age" className="block text-sm font-medium text-gray-700 mb-1">
            Min Age
          </label>
          <input
            id="min-age"
            type="number"
            placeholder="Min"
            value={filters.minAge}
            onChange={(e) => handleChange('minAge', e.target.value ? parseInt(e.target.value) : '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="max-age" className="block text-sm font-medium text-gray-700 mb-1">
            Max Age
          </label>
          <input
            id="max-age"
            type="number"
            placeholder="Max"
            value={filters.maxAge}
            onChange={(e) => handleChange('maxAge', e.target.value ? parseInt(e.target.value) : '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
