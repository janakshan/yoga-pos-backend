import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

@Injectable()
export class ReportExportService {
  private readonly logger = new Logger(ReportExportService.name);

  /**
   * Export data to CSV format
   */
  async exportToCSV(data: any[], fields?: string[]): Promise<Buffer> {
    this.logger.log('Exporting data to CSV');

    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      return Buffer.from(csv, 'utf-8');
    } catch (error) {
      this.logger.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export data to PDF format
   */
  async exportToPDF(
    title: string,
    data: any,
    options?: {
      sections?: Array<{
        title: string;
        data: any;
        type: 'table' | 'summary' | 'text';
      }>;
    },
  ): Promise<Buffer> {
    this.logger.log('Exporting data to PDF');

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(title, { align: 'center' });

        doc.moveDown();

        // Date
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated: ${new Date().toLocaleString()}`, {
            align: 'right',
          });

        doc.moveDown(2);

        // Process sections
        if (options?.sections) {
          options.sections.forEach((section, index) => {
            if (index > 0) {
              doc.addPage();
            }

            // Section title
            doc
              .fontSize(16)
              .font('Helvetica-Bold')
              .text(section.title, { underline: true });

            doc.moveDown();

            switch (section.type) {
              case 'summary':
                this.renderSummary(doc, section.data);
                break;
              case 'table':
                this.renderTable(doc, section.data);
                break;
              case 'text':
                this.renderText(doc, section.data);
                break;
            }
          });
        } else {
          // Simple data rendering
          doc.fontSize(12).font('Helvetica').text(JSON.stringify(data, null, 2));
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .text(
              `Page ${i + 1} of ${pageCount}`,
              50,
              doc.page.height - 50,
              { align: 'center' },
            );
        }

        doc.end();
      } catch (error) {
        this.logger.error('Error exporting to PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Render summary section in PDF
   */
  private renderSummary(doc: PDFKit.PDFDocument, data: any) {
    doc.fontSize(12).font('Helvetica');

    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = this.formatLabel(key);
      let formattedValue = value;

      // Format numbers
      if (typeof value === 'number') {
        formattedValue = value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }

      // Format dates
      if (value instanceof Date) {
        formattedValue = value.toLocaleString();
      }

      // Skip complex objects
      if (typeof value === 'object' && value !== null) {
        return;
      }

      doc.text(`${formattedKey}: ${formattedValue}`);
    });

    doc.moveDown();
  }

  /**
   * Render table section in PDF
   */
  private renderTable(doc: PDFKit.PDFDocument, data: any[]) {
    if (!data || data.length === 0) {
      doc.fontSize(10).text('No data available');
      return;
    }

    const headers = Object.keys(data[0]);
    const columnWidth = (doc.page.width - 100) / headers.length;

    doc.fontSize(10).font('Helvetica-Bold');

    // Table headers
    let xPos = 50;
    headers.forEach((header) => {
      doc.text(this.formatLabel(header), xPos, doc.y, {
        width: columnWidth,
        align: 'left',
      });
      xPos += columnWidth;
    });

    doc.moveDown();
    doc.font('Helvetica');

    // Table rows (limit to first 50 rows to prevent overflow)
    const limitedData = data.slice(0, 50);
    limitedData.forEach((row, rowIndex) => {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      xPos = 50;
      const yPos = doc.y;

      headers.forEach((header) => {
        let value = row[header];

        // Format values
        if (typeof value === 'number') {
          value = value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        } else if (value instanceof Date) {
          value = value.toLocaleDateString();
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        doc.text(String(value || '-'), xPos, yPos, {
          width: columnWidth - 5,
          align: 'left',
          ellipsis: true,
        });

        xPos += columnWidth;
      });

      doc.moveDown(0.5);
    });

    if (data.length > 50) {
      doc
        .moveDown()
        .fontSize(8)
        .text(
          `Note: Showing first 50 of ${data.length} rows. Export to CSV for full data.`,
        );
    }

    doc.moveDown();
  }

  /**
   * Render text section in PDF
   */
  private renderText(doc: PDFKit.PDFDocument, text: string) {
    doc.fontSize(12).font('Helvetica').text(text);
    doc.moveDown();
  }

  /**
   * Format label for display
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  /**
   * Export table performance report
   */
  async exportTablePerformanceReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.tables);
    }

    return this.exportToPDF('Table Performance Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Table Performance Details',
          data: reportData.tables,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export menu analytics report
   */
  async exportMenuAnalyticsReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.items);
    }

    return this.exportToPDF('Menu Analytics Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Top Selling Items',
          data: reportData.summary.topSellingItems,
          type: 'table',
        },
        {
          title: 'Category Breakdown',
          data: reportData.summary.categoryBreakdown,
          type: 'table',
        },
        {
          title: 'All Menu Items',
          data: reportData.items,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export server performance report
   */
  async exportServerPerformanceReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.servers);
    }

    return this.exportToPDF('Server Performance Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Top Performers',
          data: reportData.summary.topPerformers,
          type: 'table',
        },
        {
          title: 'All Servers',
          data: reportData.servers,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export kitchen metrics report
   */
  async exportKitchenMetricsReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.stations);
    }

    return this.exportToPDF('Kitchen Metrics Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Station Performance',
          data: reportData.stations,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export service type analysis report
   */
  async exportServiceTypeReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.serviceTypes);
    }

    return this.exportToPDF('Service Type Analysis Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Service Type Breakdown',
          data: reportData.serviceTypes,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export food cost analysis report
   */
  async exportFoodCostReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.categories);
    }

    return this.exportToPDF('Food Cost Analysis Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Category Analysis',
          data: reportData.categories,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export table turnover report
   */
  async exportTableTurnoverReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.byTable);
    }

    return this.exportToPDF('Table Turnover Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Table Statistics',
          data: reportData.byTable,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export peak hours report
   */
  async exportPeakHoursReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.exportToCSV(reportData.detailed);
    }

    return this.exportToPDF('Peak Hours Analysis Report', reportData, {
      sections: [
        {
          title: 'Summary',
          data: reportData.summary,
          type: 'summary',
        },
        {
          title: 'Hourly Performance',
          data: reportData.hourly,
          type: 'table',
        },
        {
          title: 'Daily Performance',
          data: reportData.daily,
          type: 'table',
        },
      ],
    });
  }

  /**
   * Export profit margin report
   */
  async exportProfitMarginReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      // Flatten the nested structure for CSV
      const flatData = [
        {
          ...reportData.analysis.revenue,
          ...reportData.analysis.costs,
          ...reportData.analysis.profitability,
          ...reportData.analysis.orderMetrics,
        },
      ];
      return this.exportToCSV(flatData);
    }

    return this.exportToPDF('Profit Margin Analysis Report', reportData, {
      sections: [
        {
          title: 'Revenue',
          data: reportData.analysis.revenue,
          type: 'summary',
        },
        {
          title: 'Costs',
          data: reportData.analysis.costs,
          type: 'summary',
        },
        {
          title: 'Profitability',
          data: reportData.analysis.profitability,
          type: 'summary',
        },
        {
          title: 'Order Metrics',
          data: reportData.analysis.orderMetrics,
          type: 'summary',
        },
      ],
    });
  }

  /**
   * Export QR ordering report
   */
  async exportQROrderingReport(
    reportData: any,
    format: 'csv' | 'pdf' | string,
  ): Promise<Buffer> {
    if (format === 'csv') {
      // Flatten the nested structure for CSV
      const flatData = [
        {
          ...reportData.analytics.qrOrders,
          ...reportData.analytics.adoption,
          ...reportData.analytics.comparison,
        },
      ];
      return this.exportToCSV(flatData);
    }

    return this.exportToPDF('QR Ordering Analytics Report', reportData, {
      sections: [
        {
          title: 'QR Orders',
          data: reportData.analytics.qrOrders,
          type: 'summary',
        },
        {
          title: 'Adoption Metrics',
          data: reportData.analytics.adoption,
          type: 'summary',
        },
        {
          title: 'Comparison',
          data: reportData.analytics.comparison,
          type: 'summary',
        },
      ],
    });
  }
}
