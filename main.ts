import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { nameByRace } from 'fantasy-name-generator'

// Remember to rename these classes and interfaces!

interface RPGToolsSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: RPGToolsSettings = {
	mySetting: 'default'
}

interface INameGeneration {
	race: string;
	readableName: string;
	hasGender: boolean;
}

const NAME_TYPES: INameGeneration[] = [
	{ race: "angel", readableName: "Angel", hasGender: true },
	{ race: "cavePerson", readableName: "Cave Person", hasGender: true },
	{ race: "darkelf", readableName: "Dark Elf", hasGender: true },
	{ race: "demon", readableName: "Demon", hasGender: false },
	{ race: "dragon", readableName: "Dragon", hasGender: true },
	{ race: "drow", readableName: "Drow", hasGender: true },
	{ race: "dwarf", readableName: "Dwarf", hasGender: true },
	{ race: "elf", readableName: "Elf", hasGender: true },
	{ race: "fairy", readableName: "Fairy", hasGender: true },
	{ race: "gnome", readableName: "Gnome", hasGender: true },
	{ race: "goblin", readableName: "Goblin", hasGender: false },
	{ race: "halfdemon", readableName: "Half Demon", hasGender: true },
	{ race: "halfling", readableName: "Halfling", hasGender: true },
	{ race: "highelf", readableName: "High Elf", hasGender: true },
	{ race: "highfairy", readableName: "High Fairy", hasGender: true },
	{ race: "human", readableName: "Human", hasGender: true },
	{ race: "ogre", readableName: "Ogre", hasGender: false },
	{ race: "orc", readableName: "Orc", hasGender: false },
]

export default class RPGTools extends Plugin {
	settings: RPGToolsSettings;

	async onload() {
		await this.loadSettings();

		NAME_TYPES.forEach((value: INameGeneration) => {
			if (value.hasGender) {
				this.addCommand({
					id: 'rpg-tools-name-' + value.race,
					name: `Generate Female ${value.readableName} Name`,
					editorCallback: (editor: Editor, view: MarkdownView) => {
						editor.replaceSelection(nameByRace(value.race, { gender: "female" }).toString());
					}
				});
				this.addCommand({
					id: 'rpg-tools-name-' + value.race,
					name: `Generate Male ${value.readableName} Name`,
					editorCallback: (editor: Editor, view: MarkdownView) => {
						editor.replaceSelection(nameByRace(value.race, { gender: "male" }).toString());
					}
				});
			} else {
				this.addCommand({
					id: 'rpg-tools-name-' + value.race,
					name: `Generate ${value.readableName} Name`,
					editorCallback: (editor: Editor, view: MarkdownView) => {
						editor.replaceSelection(nameByRace(value.race).toString());
					}
				});
			}
		});


		this.addCommand({
			id: 'rpg-tools-name-multiple',
			name: 'Generate Multiple Names',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new GenerateMultipleNamesModal(this.app).open();
					}

					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class GenerateMultipleNamesModal extends Modal {
	selectedRace: string;
	selectedGender: string;
	amount: number;

	constructor(app: App) {
		super(app);

		this.selectedRace = "human";
		this.selectedGender = "female";
		this.amount = 5;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Bulk Generator" });

		new Setting(contentEl).setName("Race").addDropdown((dropdown) => {
			let records: Record<string, string> = {};
			NAME_TYPES.forEach((val) => records[val.race] = val.readableName);
			dropdown.addOptions(records);
			dropdown.setValue(this.selectedRace);
			dropdown.onChange(selected => {
				this.selectedRace = selected;
			})
		});

		new Setting(contentEl).setName("Gender").addDropdown((dropdown) => {
			dropdown.addOptions({
				"female": "Female",
				"male": "Male"
			});
			dropdown.setValue(this.selectedGender);
			dropdown.onChange(selected => {
				this.selectedGender = selected;
			})
		});

		new Setting(contentEl).setName("Count").addText((amount) => {
			amount.setValue(this.amount.toString());
			amount.setPlaceholder("Count...");
			amount.onChange((val) => {
				this.amount = parseInt(val);
				if (this.amount == 0) {
					this.amount = 1;
				}
			})
		});

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText("Generate!");
			btn.onClick(() => {
				let generated: string[] = [];
				let canGender: boolean = NAME_TYPES.filter((val) => val.race == this.selectedRace)[0].hasGender;

				for (let i: number = 0; i < this.amount; i++) {
					if (canGender) {
						generated.push(nameByRace(this.selectedRace, { gender: this.selectedGender }).toString())
					} else {
						generated.push(nameByRace(this.selectedRace).toString())
					}
				}

				this.app.workspace.getActiveViewOfType(MarkdownView).editor.replaceSelection(generated.join("\n"))
				this.close();
			});
		})
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: RPGTools;

	constructor(app: App, plugin: RPGTools) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
