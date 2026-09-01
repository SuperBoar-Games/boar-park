// Shared admin table: sortable header, optional filter row, empty state.
//
// Every admin screen used to hand-roll this markup — 7 copies across 5 files,
// with 8 duplicated sortable-header blocks and 5 filter rows. They drifted
// apart (different alignments, different empty states, one rendering its sort
// arrows as text glyphs), and any behaviour change meant editing 4 files.
// Everything table-shaped now goes through here.

import React from 'react';
import { Icons } from './Icons';
import { Dropdown } from './Dropdown';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface FilterSelect {
    options: { id: string | number; name: string }[];
    placeholder?: string;
}

export interface Column<T> {
    /** Also the sort key and, unless filterKey says otherwise, the filter key */
    key: string;
    label: string;
    align?: ColumnAlign;
    sortable?: boolean;
    /** Cell content. Defaults to the row's value for `key`. */
    render?: (row: T) => React.ReactNode;
    /** Filter control shown in the filter row. Omit for no filter. */
    filter?: 'text' | FilterSelect;
    filterKey?: string;
    filterPlaceholder?: string;
    /** Extra class applied to both the header cell and the body cells */
    className?: string;
    /**
     * Explicit column width, e.g. '8rem'. The table uses `table-layout: fixed`
     * so that showing the filter row can't resize columns; columns left
     * without a width share whatever space remains.
     */
    width?: string;
}

export interface SortState {
    key: string;
    dir: 'asc' | 'desc';
}

interface DataTableProps<T> {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => React.Key;

    sort?: SortState;
    onSort?: (key: string) => void;

    /** Filter row is only rendered when this is true */
    showFilters?: boolean;
    filters?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;

    /** Makes rows clickable (and keyboard-activatable) */
    onRowClick?: (row: T) => void;
    rowClassName?: (row: T) => string | undefined;

    /** Trailing actions cell. Omit for no actions column. */
    actions?: (row: T) => React.ReactNode;
    actionsLabel?: string;

    /** Shown in place of rows when there are none */
    empty?: React.ReactNode;
    /** Width of the trailing actions column */
    actionsWidth?: string;
}

const alignClass = (align?: ColumnAlign) =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    sort,
    onSort,
    showFilters = false,
    filters = {},
    onFilterChange,
    onRowClick,
    rowClassName,
    actions,
    actionsLabel = 'Actions',
    empty,
    actionsWidth = '7.5rem',
}: DataTableProps<T>) {
    const colCount = columns.length + (actions ? 1 : 0);
    const hasFilters = columns.some(c => c.filter);

    const renderSortIcon = (key: string) => {
        if (sort?.key !== key) return Icons.sort;
        return sort.dir === 'asc' ? Icons.sortUp : Icons.sortDown;
    };

    return (
        <div className={`table-wrapper${showFilters && hasFilters ? ' is-filtering' : ''}`}>
            <table className="data-table">
                {/* Column widths live here so `table-layout: fixed` has a
                    single source of truth — the filter row can't influence
                    them, which is what made tables jump when filters opened. */}
                <colgroup>
                    {columns.map(col => (
                        <col key={col.key} style={col.width ? { width: col.width } : undefined} />
                    ))}
                    {actions && <col style={{ width: actionsWidth }} />}
                </colgroup>
                <thead>
                    <tr>
                        {columns.map(col => {
                            const sortable = col.sortable !== false && !!onSort;
                            const isSorted = sort?.key === col.key;
                            return (
                                <th
                                    key={col.key}
                                    className={[
                                        sortable ? 'sortable' : '',
                                        alignClass(col.align),
                                        isSorted ? 'is-sorted' : '',
                                        col.className || '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={sortable ? () => onSort!(col.key) : undefined}
                                    aria-sort={
                                        !sortable ? undefined
                                            : isSorted ? (sort!.dir === 'asc' ? 'ascending' : 'descending')
                                            : 'none'
                                    }
                                >
                                    {sortable ? (
                                        <div className="sort-header">
                                            {col.label} {renderSortIcon(col.key)}
                                        </div>
                                    ) : col.label}
                                </th>
                            );
                        })}
                        {actions && (
                            <th className="text-center col-actions">{actionsLabel}</th>
                        )}
                    </tr>

                    {showFilters && hasFilters && (
                        <tr className="filter-row">
                            {columns.map(col => {
                                const fKey = col.filterKey || col.key;
                                const value = filters[fKey] ?? '';
                                return (
                                    <td key={col.key}>
                                        {col.filter === 'text' && (
                                            <input
                                                type="text"
                                                className="filter-input"
                                                placeholder={col.filterPlaceholder || col.label}
                                                aria-label={`Filter by ${col.label.toLowerCase()}`}
                                                value={value}
                                                onChange={e => onFilterChange?.(fKey, e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        )}
                                        {col.filter && col.filter !== 'text' && (
                                            <Dropdown
                                                value={value}
                                                onChange={v => onFilterChange?.(fKey, String(v))}
                                                options={col.filter.options}
                                                placeholder={col.filter.placeholder || 'All'}
                                            />
                                        )}
                                    </td>
                                );
                            })}
                            {actions && <td />}
                        </tr>
                    )}
                </thead>

                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={colCount} className="empty">
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        rows.map(row => {
                            const clickable = !!onRowClick;
                            return (
                                <tr
                                    key={rowKey(row)}
                                    className={[
                                        clickable ? 'clickable-row' : '',
                                        rowClassName?.(row) || '',
                                    ].filter(Boolean).join(' ') || undefined}
                                    tabIndex={clickable ? 0 : undefined}
                                    onClick={clickable ? () => onRowClick!(row) : undefined}
                                    onKeyDown={clickable ? (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onRowClick!(row);
                                        }
                                    } : undefined}
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={[alignClass(col.align), col.className || '']
                                                .filter(Boolean).join(' ')}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key] ?? '')}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="text-center">{actions(row)}</td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
