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
  { id: 1, lastName: "Snow", firstName: "Jon", userName: "JonSnow" },
  { id: 2, lastName: "Lannister", firstName: "Cersei", userName: "CerseiLannister" },
  { id: 3, lastName: "Lannister", firstName: "Jaime", userName: "JaimeLannister" },
  { id: 4, lastName: "Stark", firstName: "Arya", userName: undefined },
  { id: 5, lastName: "Targaryen", firstName: "Daenerys", userName: "DaenerysTargaryen" },
  { id: 6, lastName: "Melisandre", firstName: undefined, userName: "Melisandre" },
  { id: 7, lastName: "Clifford", firstName: "Ferrara", userName: "FerraraClifford" },
  { id: 8, lastName: "Frances", firstName: "Rossini", userName: "RossiniFrances" },
  { id: 9, lastName: "Roxie", firstName: "Harvey", userName: "HarveyRoxie" },
];

export const Default: StoryObj<typeof DataGrid> = {
  args: { columns, rows, disableRowSelectionOnClick: true },
  parameters: {
    colorScheme: "both-column",
  },
};
