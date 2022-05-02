import { App, Editor, FuzzySuggestModal, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian';

// Import Templating Engine
import * as nunjucks from 'nunjucks';
nunjucks.configure({ autoescape: false });

// Import Content Generators
import { nameByRace } from 'fantasy-name-generator';
import * as FCG from 'fantasy-content-generator';

// Import Templates
import * as Templates from './templates';

interface RPGToolsSettings {
	// none so far
}

const DEFAULT_SETTINGS: RPGToolsSettings = {
	mySetting: 'default',
};

interface INameGeneration {
	race: string;
	readableName: string;
	hasGender: boolean;
}

const NAME_TYPES: INameGeneration[] = [
	{ race: 'angel', readableName: 'Angel', hasGender: true },
	{ race: 'cavePerson', readableName: 'Cave Person', hasGender: true },
	{ race: 'darkelf', readableName: 'Dark Elf', hasGender: true },
	{ race: 'demon', readableName: 'Demon', hasGender: false },
	{ race: 'dragon', readableName: 'Dragon', hasGender: true },
	{ race: 'drow', readableName: 'Drow', hasGender: true },
	{ race: 'dwarf', readableName: 'Dwarf', hasGender: true },
	{ race: 'elf', readableName: 'Elf', hasGender: true },
	{ race: 'fairy', readableName: 'Fairy', hasGender: true },
	{ race: 'gnome', readableName: 'Gnome', hasGender: true },
	{ race: 'goblin', readableName: 'Goblin', hasGender: false },
	{ race: 'halfdemon', readableName: 'Half Demon', hasGender: true },
	{ race: 'halfling', readableName: 'Halfling', hasGender: true },
	{ race: 'highelf', readableName: 'High Elf', hasGender: true },
	{ race: 'highfairy', readableName: 'High Fairy', hasGender: true },
	{ race: 'human', readableName: 'Human', hasGender: true },
	{ race: 'ogre', readableName: 'Ogre', hasGender: false },
	{ race: 'orc', readableName: 'Orc', hasGender: false },
];

export default class RPGTools extends Plugin {
	settings: RPGToolsSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'rpg-tools-name',
			name: `Generate Name`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new GenerateNameModal(this.app).open();
			},
		});

		this.addCommand({
			id: 'rpg-tools-random-npc',
			name: `Generate NPC`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection(nunjucks.renderString(Templates.NPCTemplate, FCG.NPCs.generate().formattedData).replace(/\n{2,}/gm, '\n'));
			},
		});

		this.addCommand({
			id: 'rpg-tools-random-npc-note',
			name: `Generate NPC as Note`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let npc = FCG.NPCs.generate().formattedData;
				let content = nunjucks.renderString(Templates.NPCNoteTemplate, npc).replace(/\n{2,}/gm, '\n');

				let pathSplit = view.file.path.split('/');
				pathSplit = pathSplit.slice(0, pathSplit.length - 1);
				pathSplit.push(npc.name + '.md');

				this.app.vault.create(pathSplit.join('/'), content);
			},
		});

		this.addCommand({
			id: 'rpg-tools-random-traits',
			name: `Generate Traits`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection(
					FCG.NPCs.generate()
						.formattedData.traits.map((t) => '- ' + t)
						.join('\n')
				);
			},
		});

		this.addCommand({
			id: 'rpg-tools-random-desires',
			name: `Generate Desires`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection(
					FCG.NPCs.generate()
						.formattedData.desires.map((t) => '- ' + t)
						.join('\n')
				);
			},
		});

		this.addCommand({
			id: 'rpg-tools-random-establishments',
			name: `Generate Establishment`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let establishment = FCG.Establishments.generate().formattedData;
				editor.replaceSelection(nunjucks.renderString(Templates.SettlementTemplate, establishment).replace(/\n{2,}/gm, '\n'));
			},
		});

		this.addCommand({
			id: 'rpg-tools-random-establishments-note',
			name: `Generate Establishment as Note`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let establishment = FCG.Establishments.generate().formattedData;
				let content = nunjucks.renderString(Templates.SettlementNoteTemplate, establishment).replace(/\n{2,}/gm, '\n');

				let pathSplit = view.file.path.split('/');
				pathSplit = pathSplit.slice(0, pathSplit.length - 1);
				pathSplit.push(establishment.type + ' - ' + establishment.name + '.md');

				this.app.vault.create(pathSplit.join('/'), content);
			},
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
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

interface INameGenerationSelection {
	generator: INameGeneration;
	gender: string;
}

class GenerateNameModal extends FuzzySuggestModal<INameGenerationSelection> {
	getItems(): INameGenerationSelection[] {
		let all: INameGenerationSelection[] = [];

		NAME_TYPES.forEach((val) => {
			if (val.hasGender) {
				all.push({ generator: val, gender: 'Male' });
				all.push({ generator: val, gender: 'Female' });
			} else {
				all.push({ generator: val, gender: '' });
			}
		});

		return all;
	}

	getItemText(generator: INameGenerationSelection): string {
		if (generator.gender.length > 0) {
			return generator.gender + ' ' + generator.generator.readableName;
		}
		return generator.generator.readableName;
	}

	onChooseItem(selected: INameGenerationSelection, evt: MouseEvent | KeyboardEvent) {
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			if (selected.gender.length > 0) {
				view.editor.replaceSelection(nameByRace(selected.generator.race, { gender: selected.gender.toLowerCase() }).toString());
			} else {
				view.editor.replaceSelection(nameByRace(selected.generator.race).toString());
			}
		}
	}
}

class GenerateMultipleNamesModal extends Modal {
	selectedRace: string;
	selectedGender: string;
	amount: number;

	constructor(app: App) {
		super(app);

		this.selectedRace = 'human';
		this.selectedGender = 'female';
		this.amount = 5;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h1', { text: 'Bulk Generator' });

		new Setting(contentEl).setName('Race').addDropdown((dropdown) => {
			let records: Record<string, string> = {};
			NAME_TYPES.forEach((val) => (records[val.race] = val.readableName));
			dropdown.addOptions(records);
			dropdown.setValue(this.selectedRace);
			dropdown.onChange((selected) => {
				this.selectedRace = selected;
			});
		});

		new Setting(contentEl).setName('Gender').addDropdown((dropdown) => {
			dropdown.addOptions({
				female: 'Female',
				male: 'Male',
			});
			dropdown.setValue(this.selectedGender);
			dropdown.onChange((selected) => {
				this.selectedGender = selected;
			});
		});

		new Setting(contentEl).setName('Count').addText((amount) => {
			amount.setValue(this.amount.toString());
			amount.setPlaceholder('Count...');
			amount.onChange((val) => {
				this.amount = parseInt(val);
				if (this.amount == 0) {
					this.amount = 1;
				}
			});
		});

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText('Generate!');
			btn.onClick(() => {
				let generated: string[] = [];
				let canGender: boolean = NAME_TYPES.filter((val) => val.race == this.selectedRace)[0].hasGender;

				for (let i: number = 0; i < this.amount; i++) {
					if (canGender) {
						generated.push(nameByRace(this.selectedRace, { gender: this.selectedGender }).toString());
					} else {
						generated.push(nameByRace(this.selectedRace).toString());
					}
				}

				this.app.workspace.getActiveViewOfType(MarkdownView).editor.replaceSelection(generated.join('\n'));
				this.close();
			});
		});
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
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'RPG Tools' });
		containerEl.createEl('a', { text: 'Github', href: 'https://github.com/BigJk/obsidian-rpg-tools' });
	}
}
