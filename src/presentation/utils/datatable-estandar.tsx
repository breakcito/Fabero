/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { DataTable, type DataTableColumn } from "mantine-datatable";

interface DataTableEstandarProps {
  idAccessor: string;
  columns: DataTableColumn<any>[];
  records: any[];
  initialPageSize?: number;
  loading: boolean;
  [key: string]: any;
}

export const DataTableEstandar = ({
  idAccessor,
  columns,
  records,
  initialPageSize = 25,
  loading,
  ...props
}: DataTableEstandarProps) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [prevRecords, setPrevRecords] = useState(records);

  if (records !== prevRecords) {
    setPrevRecords(records);
    setPage(1);
  }

  const pagedRecords = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return records.slice(from, to);
  }, [records, page, pageSize]);

  // Enhancing columns with absolute index if accessor is "index"
  const enhancedColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.accessor === "index") {
        return {
          ...col,
          render: (_record: any, index: number) => {
            const absoluteIndex = (page - 1) * pageSize + index + 1;
            return col.render
              ? col.render(_record, absoluteIndex - 1)
              : absoluteIndex;
          },
        };
      }
      return col;
    });
  }, [columns, page, pageSize]);

  const { minHeight = 300, ...otherProps } = props;

  return (
    <div
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden 
        backdrop-blur-sm"
    >
      <DataTable
        columns={enhancedColumns}
        records={pagedRecords}
        totalRecords={records.length}
        recordsPerPage={pageSize}
        page={page}
        minHeight={minHeight}
        onPageChange={setPage}
        recordsPerPageOptions={[5, 10, 25, 50, 100]}
        onRecordsPerPageChange={setPageSize}
        striped={true}
        highlightOnHover={true}
        fetching={loading}
        idAccessor={idAccessor}
        noRecordsText="No se encontraron registros..."
        loadingText="Cargando..."
        paginationText={({ from, to, totalRecords }) =>
          `${from} - ${to} de ${totalRecords}`
        }
        scrollAreaProps={{
          viewportProps: {
            style: {
              minHeight: minHeight,
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
        classNames={{
          root: "bg-transparent",
          table: "bg-transparent",
          header: "bg-zinc-900/80",
          pagination: "bg-zinc-900/50 border-t border-zinc-800",
        }}
        styles={{
          header: {
            "--mantine-color-text": "var(--mantine-color-zinc-3, #d4d4d8)",
          },
        }}
        {...otherProps}
      />
    </div>
  );
};
