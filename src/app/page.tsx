"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    city: "",
    degree: "",
    minExperience: "",
    maxExperience: "",
  });
  const [sortBy, setSortBy] = useState("firstName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedFilters = useDebounce(filters, 300);

  const fetchAdvocates = useCallback(
    async (
      page: number = 1,
      search: string = "",
      currentFilters: typeof filters = filters,
      currentSortBy: string = sortBy,
      currentSortOrder: string = sortOrder
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
        });

        if (search) params.append("search", search);
        if (currentFilters.city) params.append("city", currentFilters.city);
        if (currentFilters.degree)
          params.append("degree", currentFilters.degree);
        if (currentFilters.minExperience)
          params.append("minExperience", currentFilters.minExperience);
        if (currentFilters.maxExperience)
          params.append("maxExperience", currentFilters.maxExperience);

        const response = await fetch(`/api/advocates?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonResponse = await response.json();
        setAdvocates(jsonResponse.data);
        setPagination(jsonResponse.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch advocates"
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, sortBy, sortOrder, pagination.limit]
  );

  useEffect(() => {
    fetchAdvocates();
  }, [fetchAdvocates]);

  useEffect(() => {
    if (
      debouncedSearchTerm !== "" ||
      Object.values(debouncedFilters).some((v) => v !== "")
    ) {
      fetchAdvocates(1, debouncedSearchTerm, debouncedFilters);
    } else if (
      debouncedSearchTerm === "" &&
      Object.values(debouncedFilters).every((v) => v === "")
    ) {
      fetchAdvocates(1, "", debouncedFilters);
    }
  }, [debouncedSearchTerm, debouncedFilters, fetchAdvocates]);

  const handleSort = (column: string) => {
    const newSortOrder =
      sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newSortOrder);
    fetchAdvocates(
      1,
      debouncedSearchTerm,
      debouncedFilters,
      column,
      newSortOrder
    );
  };

  const handlePageChange = (newPage: number) => {
    fetchAdvocates(newPage, debouncedSearchTerm, debouncedFilters);
  };

  const handleFilterChange = (
    filterName: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      city: "",
      degree: "",
      minExperience: "",
      maxExperience: "",
    });
  };

  const uniqueValues = useMemo(
    () => ({
      cities: Array.from(new Set(advocates.map((a) => a.city))).sort(),
      degrees: Array.from(new Set(advocates.map((a) => a.degree))).sort(),
    }),
    [advocates]
  );

  const SortButton = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 hover:bg-gray-200 p-1 rounded"
    >
      <span>{children}</span>
      {sortBy === column && (
        <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Solace Advocates</h1>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, city, degree, or specialty..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <select
              className="border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
            >
              <option value="">All Cities</option>
              {uniqueValues.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Degree</label>
            <select
              className="border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
              value={filters.degree}
              onChange={(e) => handleFilterChange("degree", e.target.value)}
            >
              <option value="">All Degrees</option>
              {uniqueValues.degrees.map((degree) => (
                <option key={degree} value={degree}>
                  {degree}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Min Experience
            </label>
            <input
              type="number"
              className="w-20 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
              value={filters.minExperience}
              onChange={(e) =>
                handleFilterChange("minExperience", e.target.value)
              }
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Max Experience
            </label>
            <input
              type="number"
              className="w-20 border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
              value={filters.maxExperience}
              onChange={(e) =>
                handleFilterChange("maxExperience", e.target.value)
              }
              placeholder="50"
            />
          </div>
          <div className="flex items-end">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing {advocates.length} of {pagination.total} advocates
            {(searchTerm || Object.values(filters).some((v) => v !== "")) && (
              <span className="ml-2 text-blue-600">
                (filtered{searchTerm && ` for "${searchTerm}"`})
              </span>
            )}
          </div>
          <div>
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading advocates...</span>
        </div>
      )}

      {!loading && (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full border-collapse bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  <SortButton column="firstName">First Name</SortButton>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  <SortButton column="lastName">Last Name</SortButton>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  <SortButton column="city">City</SortButton>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  <SortButton column="degree">Degree</SortButton>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Specialties
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  <SortButton column="yearsOfExperience">Experience</SortButton>
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody>
              {advocates.map((advocate, index) => (
                <tr
                  key={advocate.id || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="border border-gray-300 px-4 py-3">
                    {advocate.firstName}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {advocate.lastName}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {advocate.city}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {advocate.degree}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="max-w-xs">
                      {advocate.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {advocate.yearsOfExperience} years
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {advocate.phoneNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {Array.from(
            { length: Math.min(5, pagination.totalPages) },
            (_, i) => {
              const pageNum = Math.max(
                1,
                Math.min(pagination.page - 2 + i, pagination.totalPages - 4 + i)
              );
              if (pageNum > pagination.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded ${
                    pageNum === pagination.page
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
          )}

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      )}

      {!loading && advocates.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <p className="text-lg">No advocates found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </main>
  );
}
