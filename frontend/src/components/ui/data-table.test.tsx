// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./data-table";
import { pageWindow } from "./pagination";

type Row = { id: string; name: string; amount: number };

const rows: Row[] = Array.from({ length: 23 }, (_, i) => ({
  id: `r${i + 1}`,
  name: `Name ${String(i + 1).padStart(2, "0")}`,
  amount: (i * 37) % 100,
}));

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "amount", header: "Amount", align: "right", sortable: true },
];

/** S.N. values of the body rows, in order. */
function serialNumbers() {
  const body = screen.getAllByRole("rowgroup")[1];
  if (!body) throw new Error("no table body");
  return within(body)
    .getAllByRole("row")
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
}

describe("DataTable", () => {
  it("shows an S.N. column and the configured column labels", () => {
    render(<DataTable columns={columns} data={rows} getRowKey={(r) => r.id} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(["S.N.", "Name", "Amount"]);
  });

  it("shows pageSize rows and continues S.N. on the next page", async () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(r) => r.id}
        pageSize={10}
      />,
    );
    expect(serialNumbers()).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(serialNumbers()[0]).toBe("11");
    expect(serialNumbers()).toHaveLength(10);
    await userEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(serialNumbers()).toEqual(["21", "22", "23"]);
  });

  it("numbers server-paged rows from the page offset", () => {
    render(
      <DataTable
        columns={columns}
        data={rows.slice(0, 5)}
        getRowKey={(r) => r.id}
        total={500}
        page={2}
        pageSize={50}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    expect(serialNumbers()[0]).toBe("51");
    expect(screen.getByText("51–100")).toBeInTheDocument();
  });

  it("sorts client-side when a sortable header is clicked", async () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(r) => r.id}
        pageSize={50}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Name/ }));
    await userEvent.click(screen.getByRole("button", { name: /Name/ }));
    const body = screen.getAllByRole("rowgroup")[1];
    if (!body) throw new Error("no table body");
    const firstName = within(body).getAllByRole("row")[0]?.textContent;
    expect(firstName).toContain("Name 23");
    // S.N. still counts positions, not original ids
    expect(serialNumbers()[0]).toBe("1");
  });

  it("shows the empty state when there are no rows", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        empty={{ title: "No transactions yet" }}
      />,
    );
    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
  });
});

describe("pageWindow", () => {
  it("lists every page when there are few", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses the middle with gaps", () => {
    expect(pageWindow(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
    expect(pageWindow(1, 20)).toEqual([1, 2, "gap", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "gap", 19, 20]);
  });
});
