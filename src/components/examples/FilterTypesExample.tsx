import type { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { DataTable } from '../ui/data-table/data-table';

// Sample data types
interface SampleData {
  id: number;
  name: string;
  age: number;
  salary: number;
  isActive: boolean;
  joinDate: string;
  department: string;
}

// Sample data
const sampleData: SampleData[] = [
  {
    id: 1,
    name: 'John Doe',
    age: 32,
    salary: 75000,
    isActive: true,
    joinDate: '2022-01-15',
    department: 'Engineering',
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 28,
    salary: 68000,
    isActive: false,
    joinDate: '2021-06-10',
    department: 'Marketing',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    age: 45,
    salary: 95000,
    isActive: true,
    joinDate: '2020-03-22',
    department: 'Engineering',
  },
  {
    id: 4,
    name: 'Alice Brown',
    age: 35,
    salary: 82000,
    isActive: true,
    joinDate: '2023-08-14',
    department: 'Sales',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    age: 29,
    salary: 71000,
    isActive: false,
    joinDate: '2022-11-03',
    department: 'Marketing',
  },
];

// Column definitions with different filter types
const columns: ColumnDef<SampleData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: { filterType: 'string' }, // String filters: contains, equals, starts with, etc.
  },
  {
    accessorKey: 'age',
    header: 'Age',
    meta: { filterType: 'number' }, // Number filters: equals, greater than, less than, etc.
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return <span>{value} years</span>;
    },
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { filterType: 'number' },
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Active',
    meta: { filterType: 'boolean' }, // Boolean filters: true/false
    cell: ({ getValue }) => {
      const value = getValue() as boolean;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      );
    },
  },
  {
    accessorKey: 'joinDate',
    header: 'Join Date',
    meta: { filterType: 'date' }, // Date filters: equals, after, before, etc.
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return new Date(value).toLocaleDateString();
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    meta: { filterType: 'string' },
  },
];

export const FilterTypesExample: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-lg">
      <div className="space-y-xs">
        <h1 className="text-2xl font-bold">DataTable Filter Types Example</h1>
        <p className="text-muted-foreground">
          This example demonstrates the different filter types available in the
          enhanced DataTable component. Each column type provides relevant
          filter operators:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
          <li>
            <strong>String columns:</strong> Contains, Equals, Starts with, Ends
            with, Not contains, Is empty, Is not empty
          </li>
          <li>
            <strong>Number columns:</strong> Equals, Greater than, Less than,
            Greater than or equal, Less than or equal, Is empty, Is not empty
          </li>
          <li>
            <strong>Date columns:</strong> Equals, After, Before, On or after,
            On or before, Is empty, Is not empty
          </li>
          <li>
            <strong>Boolean columns:</strong> Is (true/false)
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Click the filter button{' '}
          <span className="inline-flex items-center px-1 py-0.5 rounded bg-muted">
            ⚫
          </span>{' '}
          to show/hide column filters. Each filter shows the operator as a
          placeholder (e.g., "Contains", "Greater than"). Click the{' '}
          <span className="inline-flex items-center px-1 py-0.5 rounded bg-muted">
            ⌄
          </span>{' '}
          icon in the filter input to change the operator.
        </p>
      </div>

      <DataTable
        tableId="filter-types-example"
        columns={columns}
        data={sampleData}
        enableColumnFilters={true}
        enableGlobalFilter={true}
        enableSorting={true}
        enableColumnReordering={true}
        enableColumnVisibility={true}
        enableColumnResizing={true}
        showPagination={true}
        className="border rounded-lg"
      />
    </div>
  );
};

export default FilterTypesExample;
