"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const stringUtils = require('ember-cli-string-utils');
const common_tags_1 = require("common-tags");
const config_1 = require("../models/config");
require("rxjs/add/observable/of");
require("rxjs/add/operator/ignoreElements");
const schematics_1 = require("../utilities/schematics");
const dynamic_path_parser_1 = require("../utilities/dynamic-path-parser");
const app_utils_1 = require("../utilities/app-utils");
const path = require("path");
const Command = require('../ember-cli/lib/models/command');
const SilentError = require('silent-error');
const separatorRegEx = /[\/\\]/g;
exports.default = Command.extend({
    name: 'generate',
    description: 'Generates and/or modifies files based on a schematic.',
    aliases: ['g'],
    availableOptions: [
        {
            name: 'dry-run',
            type: Boolean,
            default: false,
            aliases: ['d'],
            description: 'Run through without making any changes.'
        },
        {
            name: 'force',
            type: Boolean,
            default: false,
            aliases: ['f'],
            description: 'Forces overwriting of files.'
        },
        {
            name: 'app',
            type: String,
            aliases: ['a', 'lib'],
            description: 'Specifies app name to use.'
        },
        {
            name: 'collection',
            type: String,
            aliases: ['c'],
            description: 'Schematics collection to use.'
        },
        {
            name: 'lint-fix',
            type: Boolean,
            aliases: ['lf'],
            description: 'Use lint to fix files after generation.'
        }
    ],
    anonymousOptions: [
        '<schematic>'
    ],
    getCollectionName(rawArgs) {
        let collectionName = config_1.CliConfig.getValue('defaults.schematics.collection');
        if (rawArgs) {
            const parsedArgs = this.parseArgs(rawArgs, false);
            if (parsedArgs.options.collection) {
                collectionName = parsedArgs.options.collection;
            }
        }
        return collectionName;
    },
    beforeRun: function (rawArgs) {
        const isHelp = ['--help', '-h'].includes(rawArgs[0]);
        if (isHelp) {
            return;
        }
        const schematicName = rawArgs[0];
        if (!schematicName) {
            return Promise.reject(new SilentError(common_tags_1.oneLine `
          The "ng generate" command requires a
          schematic name to be specified.
          For more details, use "ng help".
      `));
        }
        if (/^\d/.test(rawArgs[1])) {
            SilentError.debugOrThrow('@angular/cli/commands/generate', `The \`ng generate ${schematicName} ${rawArgs[1]}\` file name cannot begin with a digit.`);
        }
        const SchematicGetOptionsTask = require('../tasks/schematic-get-options').default;
        const getOptionsTask = new SchematicGetOptionsTask({
            ui: this.ui,
            project: this.project
        });
        // TODO: Delete it once this is implemented https://github.com/angular/devkit/issues/34
        let collectionName = this.getCollectionName(rawArgs);
        try {
            const collection = schematics_1.getCollection(collectionName);
            collection.createSchematic(schematicName);
        }
        catch (e) {
            collectionName = '@schematics/angular';
        }
        return getOptionsTask.run({
            schematicName,
            collectionName
        })
            .then((availableOptions) => {
            let anonymousOptions = [];
            if (collectionName === '@schematics/angular' && schematicName === 'interface') {
                anonymousOptions = ['<type>'];
            }
            this.registerOptions({
                anonymousOptions: anonymousOptions,
                availableOptions: availableOptions
            });
        });
    },
    run: function (commandOptions, rawArgs) {
        const schematicName = rawArgs[0];
        const entityName = rawArgs[1];
        if ((schematicName === 'module' || this.generatesProject(schematicName)) && !entityName) {
            throw `The \`ng generate ${schematicName}\` command requires a name to be specified.`;
        }
        commandOptions.name = stringUtils.dasherize(entityName.split(separatorRegEx).pop());
        if (!this.generatesProject(schematicName)) {
            const appConfig = app_utils_1.getAppFromConfig(commandOptions.app);
            const dynamicPathOptions = {
                project: this.project,
                entityName: entityName,
                appConfig: appConfig,
                dryRun: commandOptions.dryRun
            };
            const parsedPath = dynamic_path_parser_1.dynamicPathParser(dynamicPathOptions);
            commandOptions.sourceDir = appConfig.root;
            if (parsedPath.dir === commandOptions.sourceDir) {
                commandOptions.path = '';
            }
            else {
                commandOptions.path = parsedPath.dir
                    .replace(appConfig.root + path.sep, '')
                    .replace(separatorRegEx, '/');
            }
        }
        const cwd = this.project.root;
        const SchematicRunTask = require('../tasks/schematic-run').default;
        const schematicRunTask = new SchematicRunTask({
            ui: this.ui,
            project: this.project
        });
        // TODO: Delete it once this is implemented https://github.com/angular/devkit/issues/34
        let collectionName = this.getCollectionName(rawArgs);
        try {
            const collection = schematics_1.getCollection(collectionName);
            collection.createSchematic(schematicName);
        }
        catch (e) {
            collectionName = '@schematics/angular';
        }
        if (collectionName === '@schematics/angular' && schematicName === 'interface' && rawArgs[2]) {
            commandOptions.type = rawArgs[2];
        }
        return schematicRunTask.run({
            taskOptions: commandOptions,
            workingDir: cwd,
            collectionName,
            schematicName
        });
    },
    // Currently we assume that we always have a record in the apps array when running schematics.
    // This does not work with schematics as we can generate new records in that array.
    // For now, let's whitelist the schematic names, but a more generic solution is needed
    generatesProject: function (schematicName) {
        return schematicName === 'app' || schematicName === 'lib' || schematicName === 'nglib';
    },
    printDetailedHelp: function () {
        const engineHost = schematics_1.getEngineHost();
        const collectionName = this.getCollectionName();
        const collection = schematics_1.getCollection(collectionName);
        const schematicNames = engineHost.listSchematics(collection);
        this.ui.writeLine(chalk_1.cyan('Available schematics:'));
        schematicNames.forEach(schematicName => {
            this.ui.writeLine(chalk_1.yellow(`    ${schematicName}`));
        });
        this.ui.writeLine('');
    }
});
//# sourceMappingURL=/users/vsavkin/projects/angular-cli/commands/generate.js.map