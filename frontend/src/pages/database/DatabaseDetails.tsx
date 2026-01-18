import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { databaseApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database, DatabaseColumn, DatabaseRow, ColumnType } from '@/types';
import { ArrowLeft, Plus, Edit, Trash2, ArrowUpDown, Filter, X } from 'lucide-react';

interface FilterState {
  column: string;
  operator: string;
  value: string;
}

const DatabaseDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [database, setDatabase] = useState<Database | null>(null);
  const [columns, setColumns] = useState<DatabaseColumn[]>([]);
  const [rows, setRows] = useState<DatabaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const columnTypes: { value: ColumnType; label: string }[] = [
    { value: 'TEXT', label: t('database.columnTypes.TEXT') },
    { value: 'LARGE_TEXT', label: t('database.columnTypes.LARGE_TEXT') },
    { value: 'JSON', label: t('database.columnTypes.JSON') },
    { value: 'URL', label: t('database.columnTypes.URL') },
    { value: 'NUMBER', label: t('database.columnTypes.NUMBER') },
    { value: 'DATE', label: t('database.columnTypes.DATE') },
    { value: 'DATETIME', label: t('database.columnTypes.DATETIME') },
    { value: 'TIME', label: t('database.columnTypes.TIME') },
    { value: 'SELECT', label: t('database.columnTypes.SELECT') },
    { value: 'MULTI_SELECT', label: t('database.columnTypes.MULTI_SELECT') },
    { value: 'PHONE', label: t('database.columnTypes.PHONE') },
    { value: 'EMAIL', label: t('database.columnTypes.EMAIL') },
    { value: 'RATINGS', label: t('database.columnTypes.RATINGS') },
  ];

  // Column dialog
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<DatabaseColumn | null>(null);
  const [columnForm, setColumnForm] = useState({ name: '', type: 'TEXT' as ColumnType, is_unique: false });

  // Row dialog
  const [isRowDialogOpen, setIsRowDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DatabaseRow | null>(null);
  const [rowForm, setRowForm] = useState<Record<string, unknown>>({});

  // Delete dialogs
  const [isDeleteColumnDialogOpen, setIsDeleteColumnDialogOpen] = useState(false);
  const [isDeleteRowDialogOpen, setIsDeleteRowDialogOpen] = useState(false);
  const [deletingColumn, setDeletingColumn] = useState<DatabaseColumn | null>(null);
  const [deletingRow, setDeletingRow] = useState<DatabaseRow | null>(null);

  // Sorting and filtering
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const dbResponse = await databaseApi.getDatabase(id);
      setDatabase(dbResponse.data.database);
      setColumns(dbResponse.data.columns);

      const rowsResponse = await databaseApi.getRows(id, {
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      });
      setRows(rowsResponse.data.rows);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(t('errors.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [id, sortBy, sortOrder, filters, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Column handlers
  const handleAddColumn = async () => {
    if (!id || !columnForm.name.trim()) {
      setError(t('database.columnName') + ' ' + t('common.required').toLowerCase());
      return;
    }

    try {
      if (editingColumn) {
        await databaseApi.updateColumn(id, editingColumn.id, columnForm);
      } else {
        await databaseApi.addColumn(id, columnForm);
      }
      setIsColumnDialogOpen(false);
      setEditingColumn(null);
      setColumnForm({ name: '', type: 'TEXT', is_unique: false });
      setError('');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToSave'));
    }
  };

  const handleDeleteColumn = async () => {
    if (!id || !deletingColumn) return;

    try {
      await databaseApi.deleteColumn(id, deletingColumn.id);
      setIsDeleteColumnDialogOpen(false);
      setDeletingColumn(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete column:', err);
    }
  };

  // Row handlers
  const handleAddRow = async () => {
    if (!id) return;

    try {
      if (editingRow) {
        await databaseApi.updateRow(id, editingRow.id, rowForm);
      } else {
        await databaseApi.addRow(id, rowForm);
      }
      setIsRowDialogOpen(false);
      setEditingRow(null);
      setRowForm({});
      setError('');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToSave'));
    }
  };

  const handleDeleteRow = async () => {
    if (!id || !deletingRow) return;

    try {
      await databaseApi.deleteRow(id, deletingRow.id);
      setIsDeleteRowDialogOpen(false);
      setDeletingRow(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete row:', err);
    }
  };

  const openEditColumn = (column: DatabaseColumn) => {
    setEditingColumn(column);
    setColumnForm({ name: column.name, type: column.type, is_unique: column.is_unique });
    setError('');
    setIsColumnDialogOpen(true);
  };

  const openEditRow = (row: DatabaseRow) => {
    setEditingRow(row);
    setRowForm(row.data);
    setError('');
    setIsRowDialogOpen(true);
  };

  const openAddRow = () => {
    setEditingRow(null);
    const initialForm: Record<string, unknown> = {};
    columns.forEach((col) => {
      initialForm[col.name] = '';
    });
    setRowForm(initialForm);
    setError('');
    setIsRowDialogOpen(true);
  };

  const handleSort = (columnName: string) => {
    if (sortBy === columnName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnName);
      setSortOrder('asc');
    }
  };

  const addFilter = () => {
    if (columns.length > 0) {
      setFilters([...filters, { column: columns[0].name, operator: 'equals', value: '' }]);
    }
  };

  const updateFilter = (index: number, updates: Partial<FilterState>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const renderRowFieldInput = (column: DatabaseColumn, value: unknown, onChange: (value: unknown) => void) => {
    switch (column.type) {
      case 'LARGE_TEXT':
      case 'JSON':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.type === 'JSON' ? '{"key": "value"}' : ''}
            className={column.type === 'JSON' ? 'font-mono' : ''}
          />
        );
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'DATE':
        return (
          <Input
            type="date"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'TIME':
        return (
          <Input
            type="time"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'EMAIL':
        return (
          <Input
            type="email"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'URL':
        return (
          <Input
            type="url"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/databases')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <h1 className="text-xl font-bold">{database?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingColumn(null);
                setColumnForm({ name: '', type: 'TEXT', is_unique: false });
                setError('');
                setIsColumnDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('database.addColumn')}
            </Button>
            <Button onClick={openAddRow} disabled={columns.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              {t('database.addRow')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filters')} {filters.length > 0 && `(${filters.length})`}
          </Button>
          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters([])}
            >
              {t('common.clearAll')}
            </Button>
          )}
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={filter.column}
                      onChange={(e) => updateFilter(index, { column: e.target.value })}
                      options={columns.map((c) => ({ value: c.name, label: c.name }))}
                    />
                    <Select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value })}
                      options={[
                        { value: 'equals', label: t('database.filterOperators.equals') },
                        { value: 'contains', label: t('database.filterOperators.contains') },
                        { value: 'starts_with', label: t('database.filterOperators.starts_with') },
                        { value: 'ends_with', label: t('database.filterOperators.ends_with') },
                      ]}
                    />
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder={t('common.filter')}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeFilter(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('database.addFilter')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('database.data')} ({rows.length} {t('database.rows').toLowerCase()})</CardTitle>
          </CardHeader>
          <CardContent>
            {columns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {t('database.noColumns')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.id}>
                          <div className="flex items-center gap-2">
                            <button
                              className="flex items-center gap-1 hover:text-primary"
                              onClick={() => handleSort(column.name)}
                            >
                              {column.name}
                              {column.is_unique && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                                  {t('database.unique')}
                                </span>
                              )}
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => openEditColumn(column)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600"
                              onClick={() => {
                                setDeletingColumn(column);
                                setIsDeleteColumnDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-24">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="text-center text-gray-500 py-8">
                          {t('database.noRows')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          {columns.map((column) => (
                            <TableCell key={column.id}>
                              {typeof row.data[column.name] === 'object'
                                ? JSON.stringify(row.data[column.name])
                                : String(row.data[column.name] || '-')}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditRow(row)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingRow(row);
                                  setIsDeleteRowDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column Dialog */}
        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingColumn ? t('database.editColumn') : t('database.addColumn')}</DialogTitle>
              <DialogDescription>
                {editingColumn ? t('database.editColumn') : t('database.addColumn')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>{t('database.columnName')}</Label>
                <Input
                  value={columnForm.name}
                  onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                  placeholder={t('database.columnName')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('database.columnType')}</Label>
                <Select
                  value={columnForm.type}
                  onChange={(e) => setColumnForm({ ...columnForm, type: e.target.value as ColumnType })}
                  options={columnTypes}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label>{t('database.uniqueValues')}</Label>
                <Switch
                  checked={columnForm.is_unique}
                  onCheckedChange={(is_unique) => setColumnForm({ ...columnForm, is_unique })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsColumnDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddColumn}>
                {editingColumn ? t('common.update') : t('common.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Row Dialog */}
        <Dialog open={isRowDialogOpen} onOpenChange={setIsRowDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRow ? t('database.editRow') : t('database.addRow')}</DialogTitle>
              <DialogDescription>
                {editingRow ? t('database.editRow') : t('database.addRow')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {columns.map((column) => (
                <div key={column.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {column.name}
                    <span className="text-xs text-gray-400">({column.type})</span>
                    {column.is_unique && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                        {t('database.unique')}
                      </span>
                    )}
                  </Label>
                  {renderRowFieldInput(column, rowForm[column.name], (value) =>
                    setRowForm({ ...rowForm, [column.name]: value })
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRowDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddRow}>
                {editingRow ? t('common.update') : t('common.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Column Dialog */}
        <Dialog open={isDeleteColumnDialogOpen} onOpenChange={setIsDeleteColumnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('database.deleteColumn')}</DialogTitle>
              <DialogDescription>
                {t('database.deleteColumnConfirm', { name: deletingColumn?.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteColumnDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteColumn}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Row Dialog */}
        <Dialog open={isDeleteRowDialogOpen} onOpenChange={setIsDeleteRowDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('database.deleteRow')}</DialogTitle>
              <DialogDescription>
                {t('database.deleteRowConfirm')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteRowDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteRow}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DatabaseDetails;
