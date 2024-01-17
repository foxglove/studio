// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Paper } from "@mui/material";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { Meta, StoryObj } from "@storybook/react";

export default {
  component: DataGrid,
  title: "Theme/Data Display/DataGrid",
  decorators: [
    (Story) => {
      return (
        <Paper square style={{ height: "100%" }}>
          <Story />
        </Paper>
      );
    },
  ],
} as Meta<typeof DataGrid>;

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", filterable: false },
  { field: "firstName", headerName: "First name", flex: 1, filterable: false },
  { field: "lastName", headerName: "Last name", flex: 1, filterable: false },
  {
    field: "userName",
    headerName: "Github username",
    flex: 1,
    filterable: false,
    valueGetter: (params: GridValueGetterParams) => `@${params.row.userName ?? ""}`,
  },
];

const rows = [
  { id: 1, lastName: "Bandes-Storch", firstName: "Jacob", userName: "jtbandes" },
  { id: 2, lastName: "Shtylman", firstName: "Roman", userName: "defunctzombie" },
  { id: 3, lastName: "Carr", firstName: "Andrew", userName: "2metres" },
  { id: 4, lastName: "Macneil", firstName: "Adrian", userName: "amacneil" },
  { id: 5, lastName: "Nosenzo", firstName: "Sam", userName: "snosenzo" },
  { id: 6, lastName: "Weon", firstName: "Esther S.", userName: "esthersweon" },
  { id: 7, lastName: "Egan", firstName: "Miles", userName: "foxymiles" },
];

export const Default: StoryObj<typeof DataGrid> = {
  args: { columns, rows, disableRowSelectionOnClick: true },
  parameters: {
    colorScheme: "both-column",
  },
};
