import { test, expect } from "@jest/globals";
import { getLibName } from "../src/index";

test("The getLibName() dummy function", () => {
	expect(getLibName()).toBe("config-parser");
});
