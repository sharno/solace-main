"use client";

import { useEffect, useState } from "react";

interface Advocate {
  id?: number;
  firstName: string;
  lastName: string;
  city: string;
  degree: string;
  specialties: string[];
  yearsOfExperience: number;
  phoneNumber: number;
}

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvocates = async () => {
      try {
        console.log("fetching advocates...");
        const response = await fetch("/api/advocates");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonResponse = await response.json();
        setAdvocates(jsonResponse.data);
        setFilteredAdvocates(jsonResponse.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch advocates"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdvocates();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);

    console.log("filtering advocates...");
    const filtered = advocates.filter((advocate) => {
      const searchLower = searchValue.toLowerCase();
      return (
        advocate.firstName.toLowerCase().includes(searchLower) ||
        advocate.lastName.toLowerCase().includes(searchLower) ||
        advocate.city.toLowerCase().includes(searchLower) ||
        advocate.degree.toLowerCase().includes(searchLower) ||
        advocate.specialties.some((specialty) =>
          specialty.toLowerCase().includes(searchLower)
        ) ||
        advocate.yearsOfExperience.toString().includes(searchValue)
      );
    });

    setFilteredAdvocates(filtered);
  };

  const onClick = () => {
    console.log(advocates);
    setSearchTerm("");
    setFilteredAdvocates(advocates);
  };

  if (loading) return <div>Loading advocates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Solace Advocates</h1>

      <div className="mb-6">
        <p className="mb-2">Search</p>
        <p className="mb-2">
          Searching for: <span className="font-semibold">{searchTerm}</span>
        </p>
        <div className="flex gap-2">
          <input
            className="border border-gray-300 px-3 py-2 rounded"
            value={searchTerm}
            onChange={onChange}
            placeholder="Search advocates..."
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={onClick}
          >
            Reset Search
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">
                First Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Last Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                City
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Degree
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Specialties
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Years of Experience
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Phone Number
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAdvocates.map((advocate, index) => (
              <tr key={advocate.id || index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.firstName}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.lastName}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.city}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.degree}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.specialties.map((specialty, specialtyIndex) => (
                    <div key={specialtyIndex} className="mb-1 last:mb-0">
                      {specialty}
                    </div>
                  ))}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.yearsOfExperience}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {advocate.phoneNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAdvocates.length === 0 && !loading && (
        <p className="mt-4 text-gray-600">
          No advocates found matching your search.
        </p>
      )}
    </main>
  );
}
