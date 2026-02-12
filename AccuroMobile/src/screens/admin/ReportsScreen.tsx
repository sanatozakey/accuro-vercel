import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const ReportsScreen = () => {
  const [reportType, setReportType] = useState('bookings');
  const [dateRange, setDateRange] = useState('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const coreReports = [
    { value: 'bookings', label: 'Bookings Report' },
    { value: 'users', label: 'Users Report' },
    { value: 'quotes', label: 'Quotes Report' },
    { value: 'contacts', label: 'Contacts Report' },
  ];

  const transactionReports = [
    { value: 'activity-logs', label: 'Activity Logs Report' },
    { value: 'product-views', label: 'Product Views Report' },
    { value: 'cart-analytics', label: 'Cart Analytics Report' },
    { value: 'search-analytics', label: 'Search Analytics Report' },
    { value: 'registration-analytics', label: 'Registration Analytics Report' },
  ];

  const summaryReports = [
    { value: 'dashboard-summary', label: 'Dashboard Summary Report' },
  ];

  const allReportTypes = [
    ...coreReports,
    ...transactionReports,
    ...summaryReports,
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last3months', label: 'Last 3 Months' },
    { value: 'last6months', label: 'Last 6 Months' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const calculateDateRange = () => {
    const today = new Date();
    let start: Date;

    switch (dateRange) {
      case 'today':
        start = new Date(today);
        break;
      case 'last7days':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        break;
      case 'last3months':
        start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'last6months':
        start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        break;
      case 'lastyear':
        start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'custom':
        return { startDate, endDate };
      default:
        start = new Date(today);
        start.setDate(start.getDate() - 30);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  };

  const handleGenerateReport = async () => {
    if (dateRange === 'custom' && (!startDate || !endDate)) {
      Toast.show({
        type: 'error',
        text1: 'Missing Dates',
        text2: 'Please select both start and end dates for custom range',
      });
      return;
    }

    try {
      setLoading(true);
      const dates = calculateDateRange();

      const response = await api.post(API_ENDPOINTS.REPORTS.GENERATE, {
        reportType,
        startDate: dates.startDate,
        endDate: dates.endDate,
      });

      Toast.show({
        type: 'success',
        text1: 'Report Generated',
        text2: 'Your report has been generated successfully',
        visibilityTime: 3000,
      });

      // Handle report data here (could download, display, etc.)
      console.log('Report data:', response.data);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: error.response?.data?.message || 'Failed to generate report',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Admin</Text>
        </View>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSubtitle}>
          Generate detailed reports for analysis
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Type Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="file-document-outline" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Report Type</Text>
            </View>

            <Text style={styles.label}>Select Report Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={reportType}
                onValueChange={(value) => setReportType(value)}
                style={styles.picker}
              >
                <Picker.Item label="-- Core Reports --" value="" enabled={false} />
                {coreReports.map((report) => (
                  <Picker.Item
                    key={report.value}
                    label={report.label}
                    value={report.value}
                  />
                ))}
                <Picker.Item
                  label="-- Transaction & Activity Reports --"
                  value=""
                  enabled={false}
                />
                {transactionReports.map((report) => (
                  <Picker.Item
                    key={report.value}
                    label={report.label}
                    value={report.value}
                  />
                ))}
                <Picker.Item
                  label="-- Summary Reports --"
                  value=""
                  enabled={false}
                />
                {summaryReports.map((report) => (
                  <Picker.Item
                    key={report.value}
                    label={report.label}
                    value={report.value}
                  />
                ))}
              </Picker>
            </View>
          </Card.Content>
        </Card>

        {/* Date Range Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="calendar-range" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Date Range</Text>
            </View>

            <Text style={styles.label}>Select Date Range</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={dateRange}
                onValueChange={(value) => setDateRange(value)}
                style={styles.picker}
              >
                {dateRanges.map((range) => (
                  <Picker.Item
                    key={range.value}
                    label={range.label}
                    value={range.value}
                  />
                ))}
              </Picker>
            </View>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <View style={styles.customDateRange}>
                <Input
                  label="Start Date"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                />
                <Input
                  label="End Date"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Date Range Buttons */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>Quick Date Ranges</Text>
            <View style={styles.quickDateButtons}>
              <Button
                mode={dateRange === 'today' ? 'contained' : 'outlined'}
                onPress={() => setDateRange('today')}
                style={styles.quickDateButton}
              >
                Today
              </Button>
              <Button
                mode={dateRange === 'last7days' ? 'contained' : 'outlined'}
                onPress={() => setDateRange('last7days')}
                style={styles.quickDateButton}
              >
                Last 7 Days
              </Button>
              <Button
                mode={dateRange === 'last30days' ? 'contained' : 'outlined'}
                onPress={() => setDateRange('last30days')}
                style={styles.quickDateButton}
              >
                Last 30 Days
              </Button>
              <Button
                mode={dateRange === 'last3months' ? 'contained' : 'outlined'}
                onPress={() => setDateRange('last3months')}
                style={styles.quickDateButton}
              >
                Last 3 Months
              </Button>
              <Button
                mode={dateRange === 'last6months' ? 'contained' : 'outlined'}
                onPress={() => setDateRange('last6months')}
                style={styles.quickDateButton}
              >
                Last 6 Months
              </Button>
              <Button
                mode={dateRange === 'lastyear' ? 'contained' : 'outlined'}
                onPress={() => setDateRange('lastyear')}
                style={styles.quickDateButton}
              >
                Last Year
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Generate Button */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleGenerateReport}
              loading={loading}
              disabled={loading}
              style={styles.generateButton}
              icon="download"
            >
              Generate Report
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  picker: {
    height: 50,
  },
  customDateRange: {
    marginTop: 16,
  },
  quickDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDateButton: {
    flex: 0,
    minWidth: '30%',
  },
  generateButton: {
    backgroundColor: COLORS.primary,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ReportsScreen;
