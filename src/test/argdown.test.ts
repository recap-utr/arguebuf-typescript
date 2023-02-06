import { assertType, expect, test } from "vitest";
import * as model from "../model/index.js";
import * as aif from "../schemas/aif.js";

import {
    ArgdownApplication,
    IArgdownRequest,
    ParserPlugin,
    ModelPlugin,
    PreselectionPlugin,
    MapPlugin,
    JSONExportPlugin,
} from "@argdown/core";
import { IArgument, IStatement } from "@argdown/core/dist/model/model.js";

const input = `
[Argdown is the best]: Argdown is the best
tool for analyzing complex argumentation
and creating argument maps.
  - <Editors easier>: Argument map editors
    are way easier to use. #pro-editor
    + <WYSIWYG>: In argument map editors what
      you see during editing is what you get
      at the end: an argument map. #pro-editor
  + <Pure Data>: With Argdown no user interface
    gets in your way. You can focus on writing
    without getting distracted.
`;

test("argdown package", () => {

    const app = new ArgdownApplication();

    const parserPlugin = new ParserPlugin();
    app.addPlugin(parserPlugin, "parse-input");

    const modelPlugin = new ModelPlugin();
    app.addPlugin(modelPlugin, "build-model");

    /*
    const jsonExportPlugin = new JSONExportPlugin();
    app.addPlugin(jsonExportPlugin, "export-json");
    */

    const preselectionPlugin = new PreselectionPlugin();
    app.addPlugin(preselectionPlugin, "preselection-plugin");

    const mapPlugin = new MapPlugin();
    app.addPlugin(mapPlugin, "map-plugin");

    const request: IArgdownRequest = {
        input,
        process: ["parse-input", "build-model", "preselection-plugin", "map-plugin"],
        logLevel: "verbose"
    }
    const response = app.run(request);

    // var x = response.arguments!["Argument from racial hatred"].members;
    var x = response.map
    console.log(x)
    /*
    for (var key in response.arguments) {
        if (response.arguments.hasOwnProperty(key)) {
            console.log(key + " -> " + response.arguments[key]);
        }
    }*/

    // console.log(response.arguments)

});