import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Building2, Users, MapPin, Phone, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SOCenter {
  id: string;
  centerId: string;
  name: string;
  managerName?: string;
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  phone: string;
  classWiseCount: Record<string, number>;
  dropoutCount: number;
  totalActiveStudents: number;
  registrationDate: string;
}

interface AddressFilter {
  stateId: string;
  districtId: string;
  mandalId: string;
  villageId: string;
}

export default function CentersOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AddressFilter>({
    stateId: '',
    districtId: '',
    mandalId: '',
    villageId: ''
  });

  // Fetch SO Centers data
  const { data: centers, isLoading } = useQuery<SOCenter[]>({
    queryKey: ['/api/marketing/centers-overview'],
    enabled: true,
  });

  // Fetch address hierarchy data
  const { data: states } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts } = useQuery({
    queryKey: ['/api/admin/addresses/districts', filters.stateId],
    enabled: !!filters.stateId,
  });

  const { data: mandals } = useQuery({
    queryKey: ['/api/admin/addresses/mandals', filters.districtId],
    enabled: !!filters.districtId,
  });

  const { data: villages } = useQuery({
    queryKey: ['/api/admin/addresses/villages', filters.mandalId],
    enabled: !!filters.mandalId,
  });

  // Filter centers based on search and location filters
  const filteredCenters = centers?.filter(center => {
    const matchesSearch = center.centerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = !filters.stateId || center.state === filters.stateId;
    const matchesDistrict = !filters.districtId || center.district === filters.districtId;
    const matchesMandal = !filters.mandalId || center.mandal === filters.mandalId;
    const matchesVillage = !filters.villageId || center.village === filters.villageId;

    return matchesSearch && matchesState && matchesDistrict && matchesMandal && matchesVillage;
  }) || [];

  const handleExportToExcel = () => {
    // Implementation for Excel export
    console.log('Exporting to Excel...');
  };

  const formatClassWiseCount = (classWiseCount: Record<string, number>) => {
    return Object.entries(classWiseCount)
      .map(([className, count]) => `${className}: ${count}`)
      .join(', ');
  };

  const resetFilters = () => {
    setFilters({
      stateId: '',
      districtId: '',
      mandalId: '',
      villageId: ''
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SO Centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SO Centers Overview</h1>
          <p className="text-gray-600">Comprehensive view of all Study Organization Centers</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleExportToExcel} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Centers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{centers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {centers?.reduce((sum, center) => sum + center.totalActiveStudents, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Dropouts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {centers?.reduce((sum, center) => sum + center.dropoutCount, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Students/Center</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {centers?.length ? Math.round((centers.reduce((sum, center) => sum + center.totalActiveStudents, 0) / centers.length)) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by Center ID or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* State Filter */}
            <Select
              value={filters.stateId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, stateId: value, districtId: '', mandalId: '', villageId: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states?.map((state: any) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* District Filter */}
            <Select
              value={filters.districtId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, districtId: value, mandalId: '', villageId: '' }))}
              disabled={!filters.stateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {districts?.map((district: any) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mandal Filter */}
            <Select
              value={filters.mandalId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, mandalId: value, villageId: '' }))}
              disabled={!filters.districtId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Mandal" />
              </SelectTrigger>
              <SelectContent>
                {mandals?.map((mandal: any) => (
                  <SelectItem key={mandal.id} value={mandal.id}>
                    {mandal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Village Filter */}
            <Select
              value={filters.villageId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, villageId: value }))}
              disabled={!filters.mandalId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Village" />
              </SelectTrigger>
              <SelectContent>
                {villages?.map((village: any) => (
                  <SelectItem key={village.id} value={village.id}>
                    {village.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={resetFilters} variant="outline">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle>SO Centers ({filteredCenters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Center ID</TableHead>
                  <TableHead>Center Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Class-wise Count</TableHead>
                  <TableHead>Dropouts</TableHead>
                  <TableHead>Active Students</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium text-green-600">
                      {center.centerId}
                    </TableCell>
                    <TableCell className="font-semibold">{center.name}</TableCell>
                    <TableCell>{center.managerName || 'Not Assigned'}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin size={12} />
                        <span>{center.village}, {center.mandal}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {center.district}, {center.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone size={12} />
                        {center.phone}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm truncate" title={formatClassWiseCount(center.classWiseCount)}>
                        {formatClassWiseCount(center.classWiseCount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.dropoutCount > 5 ? "destructive" : center.dropoutCount > 0 ? "secondary" : "outline"}>
                        {center.dropoutCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {center.totalActiveStudents}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar size={12} />
                        {new Date(center.registrationDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCenters.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No centers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}