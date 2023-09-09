import {App, Editor, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as SunCalc from 'suncalc';

interface MagickJournalSettings {
	defaultLocation: string;
	headerFields: string;
	magickDateFields: string,
	astrologyIncludeEmoji: boolean,
	astrologyIncludeEnglish: boolean,
	weatherUseGeolocation: boolean,
	weatherGeolocation: string,
	weatherTempDecimalPlaces: string,
	weatherTempUnits: string,
	weatherPressureUnits: string,
}

const DEFAULT_SETTINGS: MagickJournalSettings = {
	defaultLocation: '',
	headerFields: 'Astro, Anno, Day, EV, Blank, Time, Moon, Location, Weather, Other',
	magickDateFields: 'Astro, Anno, Day, EV, Time',
	astrologyIncludeEmoji: true,
	astrologyIncludeEnglish: true,
	weatherUseGeolocation: true,
	weatherGeolocation: '',
	weatherTempDecimalPlaces: '2',
	weatherTempUnits: 'fahrenheit',
	weatherPressureUnits: 'inches',
}

export default class MagickJournalPlugin extends Plugin {
	settings: MagickJournalSettings;
	AstroHeading = '';
	SolarData = {'moon_illumination': '', 'moon_phase': ''};
	SunEraLegis = '';
	MoonEraLegis = '';
	MoonPhase = '';
	LatinDayOfWeek = '';
	WeatherDescription = '';
	NewAeonYear = '';
	EVDate = '';
	GeoLocation = {lat: '', lon: '', timezone: ''};
	ReloadSunMoonData(date : Date){
		this.SolarData['moon_illumination'] = (SunCalc.getMoonIllumination(date)['fraction']*100).toFixed(0);
		this.SolarData['moon_phase'] = this.MoonPhaseToName(SunCalc.getMoonIllumination(date)['phase']);
		this.MoonPhase = this.SolarData['moon_phase'] + ' ' + this.SolarData['moon_illumination'] + '%';
	}

	MoonPhaseToName(phase : number) : string {
		/*
		Phase	Name
		0		New Moon
				Waxing Crescent
		0.25	First Quarter
				Waxing Gibbous
		0.5		Full Moon
				Waning Gibbous
		0.75	Last Quarter
				Waning Crescent
		 */
		if (phase < 0.1) {
			return 'New Moon';
		} else if (phase < 0.24) {
			return 'Waxing Crescent';
		} else if (phase < 0.26) {
			return 'First Quarter';
		} else if (phase < 0.49) {
			return 'Waxing Gibbous';
		} else if (phase < 0.51) {
			return 'Full Moon';
		} else if (phase < 0.74) {
			return 'Waning Gibbous';
		} else if (phase < 0.751) {
			return 'Last Quarter';
		} else if (phase < 1) {
			return 'Waning Crescent';
		} else {
			return '';
		}
	}
	ReloadData(){
		const params = {format: 'txt', tz: '', lang: 'english', location: '', emojis: false};

		const tzOffset = new Date().getTimezoneOffset();
		const tzSign = (tzOffset <= 0) ? '' : '-';
		let isoOffset = String((Math.abs(tzOffset) / 60) * 100);
		for (let i = 4 - isoOffset.toString().length; i > 0 ; i--) {
			isoOffset = '0' + isoOffset;
		}
		params['tz'] = tzSign + isoOffset;

		const today = new Date();
		fetch('http://ip-api.com/json/')
			.then(response => response.json())
			.then(data => {
				if (data != null) {
					this.GeoLocation = data;
					params['location'] = this.GeoLocation.lat + ':' + this.GeoLocation.lon;
					this.ReloadSunMoonData(today);
					this.UpdateWeatherDescription();
					this.fetchEraLegis(params).then(data => {
						this.UpdateEraLegisVars(data);
					});
				}
			})
			.catch(error => {
				console.error('Error fetching or parsing data:', error);
			});
	}
	async fetchEraLegis(params : {format: string, tz: string, lang: string, location: string}): Promise<string> {
		const base_url = 'https://date.eralegis.info/';
		const url = new URL(base_url + (''));
		// @ts-ignore
		Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
		return fetch(url)
			.then( function(response) {
				return response.text();
			})
			.then( function(text) {
				return text;
			});
	}

	GetLatinDayOfWeek() {
		this.LatinDayOfWeek = new Date().toLocaleDateString('en-US', {weekday: 'long'});
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Sunday', 'dies Solis ☉');
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Monday', 'dies Lunae ☽');
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Tuesday', 'dies Martis ♂');
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Wednesday', 'dies Mercurii ☿');
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Thursday', 'dies Iovis ♃');
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Friday', 'dies Veneris ♀');
		this.LatinDayOfWeek = this.LatinDayOfWeek.replace('Saturday', 'dies Saturni ♄');
		return this.LatinDayOfWeek;
	}

	UpdateAstroSigns(input : string): string {
		if (input.includes('Aries')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Aries ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♈';
			}
			input = input.replace('Aries', output);
		}
		if (input.includes('Taurus')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Taurus ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♉';
			}
			input = input.replace('Taurus', output);
		}
		if (input.includes('Gemini')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Gemini ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♊';
			}
			input = input.replace('Gemini', output);
		}
		if (input.includes('Cancer')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Cancer ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♋';
			}
			input = input.replace('Cancer', output);
		}
		if (input.includes('Leo')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Leo ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♌';
			}
			input = input.replace('Leo', output);
		}
		if (input.includes('Virgo')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Virgo ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♍';
			}
			input = input.replace('Virgo', output);
		}
		if (input.includes('Libra')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Libra ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♎';
			}
			input = input.replace('Libra', output);
		}
		if (input.includes('Scorpio')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Scorpio ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♏';
			}
			input = input.replace('Scorpio', output);
		}
		if (input.includes('Sagittarius')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Sagittarius ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♐';
			}
			input = input.replace('Sagittarius', output);
		}
		if (input.includes('Capricorn')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Capricorn ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♑';
			}
			input = input.replace('Capricorn', output);
		}
		if (input.includes('Aquarius')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Aquarius ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♒';
			}
			input = input.replace('Aquarius', output);
		}
		if (input.includes('Pisces')) {
			let output = '';
			if (this.settings.astrologyIncludeEnglish) {
				output = output + 'Pisces ';
			}
			if (this.settings.astrologyIncludeEmoji) {
				output = output + '♓';
			}
			input = input.replace('Pisces', output);
		}
		return input;
	}
	UpdateEraLegisVars(EraLegisOutput : string) {
		let formatted = EraLegisOutput.replace('Year', 'Anno');
		formatted = formatted.replace('of the New Aeon', 'A.N.');
		// Replaces astro signs string with string according to settings
		formatted = this.UpdateAstroSigns(formatted);
		// Split formatted string into an array by : symbol
		const formattedArray = formatted.split(':');
		// solis is the first part of the array
		this.SunEraLegis = formattedArray[0];
		// moon is the second part of the array
		this.MoonEraLegis = formattedArray[1];
		// formattedArray[2] is Day of the Week which we process elsewhere
		// anno is the third part of the array
		this.NewAeonYear = formattedArray[3].trim();
		// Add ** to the front and back of anno
		this.NewAeonYear = '**' + this.NewAeonYear + '**';
		// First part of output is astrological with a newline after
		this.AstroHeading = this.SunEraLegis + ':' + this.MoonEraLegis;
	}

	GetMagickDate(): string {
		// First we get the default fields from the settings
		const magickDateFields = this.settings.magickDateFields.toLowerCase().split(',');
		return this.ParseFieldListIntoString(magickDateFields).replace(/\*/g, '');
	}

	ParseFieldListIntoString(input : string[]): string {
		let output = '';
		input.forEach(function(field) {
			field = field.trim();
			if (field == "astro") {
				output = output + this.AstroHeading + '\n';
			} else if (field == "anno") {
				output = output + this.NewAeonYear + '\n';
			} else if (field == "day") {
				output = output + this.GetLatinDayOfWeek() + '\n';
			} else if (field == "ev") {
				output = output + this.GetEVDate() + '\n';
			} else if (field == "time") {
				output = output + '**Time:** '+this.formatAMPM(new Date())+'\n';
			} else if (field == "moon") {
				output = output + '**Moon:** ' + this.MoonPhase + '\n';
			} else if (field == "location") {
				output = output + '**Location:** ' + this.settings.defaultLocation + '\n';
			} else if (field == "weather") {
				output = output + '**Current Weather:** ' + this.WeatherDescription + '\n';
			} else if (field == "blank") {
				output = output + '\n';
			} else {
				output = output + '**' + field.split(' ')
					.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
					.join(' ') + ':** \n';
			}
		}, this);
		// @ts-ignore
		return output;
	}

	GetFullHeading():string {
		// First we get the default fields from the settings
		const defaultFields = this.settings.headerFields.toLowerCase().split(',');
		// Then we loop through each field and add it to the output
		return this.ParseFieldListIntoString(defaultFields);
	}

	GetExtraFields():string {
		let output = ''
		// First we get the default fields from the settings
		const defaultFields = this.settings.headerFields.toLowerCase().split(',');
		// Then we loop through each field and add it to the output
		defaultFields.forEach(function(field) {
			field = field.trim();
			if (field != "astro" && field != "anno" && field != "day" && field != "ev" && field != "time" && field != "moon" && field != "location" && field != "weather" && field != "blank") {
				output = output + '**' + field.split(' ')
					.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
					.join(' ') + ':** \n';
			}
		}, this);
		return output
	}

	GetEVDate() {
		this.EVDate = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getFullYear();
		this.EVDate = this.EVDate + ' e.v.';
		return this.EVDate
	}

	UpdateWeatherDescription(): string {
		const weatherParams = { latitude: '', longitude: '',
			hourly: 'temperature_2m,pressure_msl,surface_pressure,weathercode', temperature_unit: '',
			windspeed_unit: 'mph', precipitation_unit: '', timezone: '', forecast_days: 1, current_weather: 'true'};
		if (!this.settings.weatherUseGeolocation) {
			const fields = this.settings.weatherGeolocation.split(',');
			weatherParams['latitude'] = fields[0];
			weatherParams['longitude'] = fields[1];
		} else {
			weatherParams['latitude'] = this.GeoLocation.lat;
			weatherParams['longitude'] = this.GeoLocation.lon;
		}

		weatherParams['temperature_unit'] = this.settings.weatherTempUnits.toLowerCase();
		weatherParams['windspeed_unit'] = 'mph';
		weatherParams['precipitation_unit'] = 'inch';
		weatherParams['timezone'] = this.GeoLocation.timezone;

		const weatherURL = new URL('https://api.open-meteo.com/v1/forecast');
		//console.log(weatherURL)
		// @ts-ignore
		Object.keys(weatherParams).forEach(key => weatherURL.searchParams.append(key, weatherParams[key]));
		fetch(weatherURL).then(response => response.json()).then(data => {
			const temperature = data['current_weather']['temperature'].toFixed(Number(this.settings.weatherTempDecimalPlaces));
			let index = '';
			const currentTime = data['current_weather']['time'];
			// loop through hourly times to find the index of the current time
			for (let i = 0; i < data['hourly']['time'].length; i++) {
				if (data['hourly']['time'][i] == currentTime) {
					index = String(i);
				}
			}

			let pressure: string;
			if (this.settings.weatherPressureUnits.toLowerCase() != 'mbar') {
				pressure = this.MbrToInches(data['hourly']['pressure_msl'][index]).toFixed(2) + 'in';
			} else {
				pressure = data['hourly']['pressure_msl'][index].toFixed(2) + 'mbar';
			}

			const WeatherDescription = this.WeatherCodeToString(data['current_weather']['weathercode']);
			if (this.settings.weatherTempUnits.toLowerCase() == 'celsius') {
				this.WeatherDescription = WeatherDescription + ', ' + temperature + '°C, ' + pressure;
			} else {
				this.WeatherDescription = WeatherDescription + ', ' + temperature + '°F, ' + pressure;
			}
		});
		return this.WeatherDescription;
	}

	WeatherCodeToString(code : number) : string {
		/*
		Code		Description
		0			Clear Sky
		1, 2, 3		Mainly Clear, Partly Cloudy, and Overcast
		45, 48		Fog and Depositing Rime Fog
		51, 53, 55	Drizzle: Light, Moderate, and Dense intensity
		56, 57		Freezing Drizzle: Light and Dense intensity
		61, 63, 65	Rain: Slight, Moderate and Heavy intensity
		66, 67		Freezing Rain: Light and Heavy intensity
		71, 73, 75	Snow fall: Slight, Moderate, and Heavy intensity
		77			Snow Grains
		80, 81, 82	Rain showers: Slight, Moderate, and Violent
		85, 86		Snow showers Slight and Heavy
		95 *		Thunderstorm: Slight or Moderate
		96, 99 *	Thunderstorm with Slight and Heavy Hail
		 */
		const WeatherCodes = {
			0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
			45: 'Fog', 48: 'Depositing Rime Fog',
			51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
			56: 'Light Freezing Drizzle', 57: 'Dense Freezing Drizzle',
			61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
			66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
			71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
			77: 'Snow Grains',
			80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
			85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
			95: 'Slight/Moderate Thunderstorm',
			96: 'Slight Hail Thunderstorm', 99: 'Heavy Hail Thunderstorm'
		}
		// @ts-ignore
		return WeatherCodes[code];
	}

	MbrToInches(mbr : number) : number {
		return mbr * 0.02953;
	}

	formatAMPM(date : Date) {
		let hours = date.getHours();
		let minutes  = String(date.getMinutes());
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be 12
		minutes = Number(minutes) < 10 ? '0'+minutes : minutes;
		// tz is the current timezone in word format
		const tz = new Date()
			.toLocaleDateString('en-US', {
				day: '2-digit',
				timeZoneName: 'short',
			})
			.slice(4)
		return hours + ':' + minutes + ' ' + ampm + ' ' + tz;
	}

	async onload() {
		await this.loadSettings();
		this.ReloadData()

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('wand', 'Greet', (_: MouseEvent) => {
			// Called when the user clicks the icon.
			this.ReloadData();
			this.GetFullHeading();
			new Notice(this.GetMagickDate());
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Adds a command to insert thelemic date
		this.addCommand({
			id: "full-heading",
			name: "Insert Full Thelemic Date Header",
			editorCallback: (editor: Editor) => {
				this.ReloadData();
				const fullHeading = this.GetFullHeading();
				editor.replaceRange(
					fullHeading,
					editor.getCursor()
				)
				const lineCount = fullHeading.split('\n').length;
				const offset = fullHeading.split('\n')[fullHeading.split('\n').length-2].length;
				editor.setCursor(editor.getCursor().line + lineCount - 2, offset );
			},
		});

		// Adds a command to insert the astrological heading
		this.addCommand({
			id: "insert-astro",
			name: "Insert Astrological Info",
			editorCallback: (editor: Editor) => {
				this.ReloadData();
				editor.replaceRange(
					this.AstroHeading + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		this.addCommand({
			id: "insert-extra-fields",
			name: "Insert Extra Fields",
			editorCallback: (editor: Editor) => {
				const additionalFields = this.GetExtraFields();
				editor.replaceRange(
					additionalFields,
					editor.getCursor()
				);
				// Split additional fields by newline and count the number of lines
				const lineCount = additionalFields.split('\n').length;
				editor.setCursor(editor.getCursor().line + lineCount + 1);
			}
		},);

		// Adds a command to insert the current time
		this.addCommand({
			id: "insert-time",
			name: "Insert Time",
			editorCallback: (editor: Editor) => {
				const time = '**Time:** '+this.formatAMPM(new Date())+'\n';
				editor.replaceRange(
					time + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		// Adds a command to insert date ev
		this.addCommand({
			id: "insert-date-ev",
			name: "Insert Date EV",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					this.GetEVDate() + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		// Adds a command to insert date AN
		this.addCommand({
			id: "insert-date-an",
			name: "Insert Date AN",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					this.NewAeonYear + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		// Adds a command to insert day of week
		this.addCommand({
			id: "insert-day",
			name: "Insert Day",
			editorCallback: (editor: Editor) => {
				this.GetLatinDayOfWeek();
				editor.replaceRange(
					this.GetLatinDayOfWeek() + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		// Adds a command to insert day of week
		this.addCommand({
			id: "insert-weather",
			name: "Insert Weather",
			editorCallback: (editor: Editor) => {
				this.ReloadData();
				editor.replaceRange(
					'**Current Weather:** ' + this.WeatherDescription + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		// Adds a command to insert moon phase
		this.addCommand({
			id: "insert-moon",
			name: "Insert Moon Phase",
			editorCallback: (editor: Editor) => {
				this.ReloadSunMoonData(new Date());
				editor.replaceRange(
					'**Moon:** ' + this.MoonPhase + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});


		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText(this.EVDate + this.LatinDayOfWeek + this.NewAeonYear + this.AstroHeading + this.MoonPhase);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MagickJournalSettingsTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class MagickJournalSettingsTab extends PluginSettingTab {
	plugin: MagickJournalPlugin;

	constructor(app: App, plugin: MagickJournalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl("h1", { text: "Magick Journal Settings" });
		const entry_settings = containerEl.createEl("div");//, { cls: "settings_section" });
		entry_settings.createEl("div", { text: "Default Entry Settings", cls: "settings_section_title" });
		entry_settings.createEl("small", { text: "Defaults for Auto-Populated Entries", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Default Location')
			.setDesc('Default location for header')
			.setClass("setting")
			.addText(text => text
				.setPlaceholder('Enter a location')
				.setValue(this.plugin.settings.defaultLocation)
				.onChange(async (value) => {
					this.plugin.settings.defaultLocation = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl("br");
		containerEl.createEl("br");

		const header_field_settings = containerEl.createEl("div");
		header_field_settings.createEl("div", { text: "Default Fields", cls: "settings_section_title" });
		header_field_settings.createEl("small", { text: "Defaults for Fields Created", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Header Fields')
			.setDesc('Comma separated fields to populate full header with.' +
				' Options are: Astro, Anno, Day, EV, Time, Moon, Location, Weather, and Blank to insert a blank line.' +
				' Unrecognized options will be inserted as additional fields.')
			.setClass("setting")
			.addTextArea(textarea => textarea
				.setPlaceholder('Enter default header fields separated by a comma.')
				.setValue(this.plugin.settings.headerFields)
				.onChange(async (value) => {
					this.plugin.settings.headerFields = value;
					await this.plugin.saveSettings();
				}));


		containerEl.createEl("br");
		containerEl.createEl("br");

		const magickdate_field_settings = containerEl.createEl("div");
		magickdate_field_settings.createEl("div", { text: "Magick Date", cls: "settings_section_title" });
		magickdate_field_settings.createEl("small", { text: "Magick Date Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Magick Date Fields')
			.setDesc('Comma separated fields to populate magick date output.' +
				' Options are: Astro, Anno, Day, EV, Time, Moon, Location, Weather, and Blank to insert a blank line.' +
				' Unrecognized options will be inserted as additional fields.')
			.setClass("setting")
			.addTextArea(textarea => textarea
				.setPlaceholder('Enter default header fields separated by a comma.')
				.setValue(this.plugin.settings.magickDateFields)
				.onChange(async (value) => {
					this.plugin.settings.magickDateFields = value;
					await this.plugin.saveSettings();
				}));


		containerEl.createEl("br");
		containerEl.createEl("br");

		const astro_field_settings = containerEl.createEl("div");
		astro_field_settings.createEl("div", { text: "Astrology Field", cls: "settings_section_title" });
		astro_field_settings.createEl("small", { text: "Astrology Field Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Emojis in Astrology Field')
			.setDesc('Include emojis in the Astrology Field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include emojis in the astrology field.')
				.setValue(this.plugin.settings.astrologyIncludeEmoji)
				.onChange(async (value) => {
					this.plugin.settings.astrologyIncludeEmoji = value;
					await this.plugin.saveSettings();
					this.plugin.ReloadData();
				}));

		new Setting(containerEl)
			.setName('English Names in Astrology Field')
			.setDesc('Include english sign names in the astrology field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include english sign names in the astrology field.')
				.setValue(this.plugin.settings.astrologyIncludeEnglish)
				.onChange(async (value) => {
					this.plugin.settings.astrologyIncludeEnglish = value;
					await this.plugin.saveSettings();
					this.plugin.ReloadData();
				}));

		containerEl.createEl("br");
		containerEl.createEl("br");

		const weather_field_settings = containerEl.createEl("div");
		weather_field_settings.createEl("div", { text: "Weather Field", cls: "settings_section_title" });
		weather_field_settings.createEl("small", { text: "Weather Field Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('IP Weather Geolocation')
			.setDesc('Use IP based geolocation, disable to use manually entered coordinates.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Use manual weather geolocation instead of IP based geolocation.')
				.setValue(this.plugin.settings.weatherUseGeolocation)
				.onChange(async (value) => {
					this.plugin.settings.weatherUseGeolocation = value;
					await this.plugin.saveSettings();
					this.plugin.ReloadData();
				}));

		new Setting(containerEl)
			.setName('Geolocation Coordinates')
			.setDesc('Manually enter your geolocation latitude and longitude, comma separated, for more accurate weather data.')
			.setClass("setting")
			.addText(textarea => textarea
				.setValue(this.plugin.settings.weatherGeolocation)
				.onChange(async (value) => {
					this.plugin.settings.weatherGeolocation = value;
					this.plugin.UpdateWeatherDescription();
					await this.plugin.saveSettings();
				}).then(() => {this.plugin.ReloadData()}));

		new Setting(containerEl)
			.setName('Temperature Decimal Places')
			.setDesc('Number of decimal places to include in weather field temperature output.')
			.setClass("setting")
			.addText(textarea => textarea
				.setValue(this.plugin.settings.weatherTempDecimalPlaces)
				.onChange(async (value) => {
					this.plugin.settings.weatherTempDecimalPlaces = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Temperature Units')
			.setDesc('Choose between Fahrenheit and Celsius for weather output.')
			.setClass("setting")
			.addDropdown(dropDown => {
				dropDown.addOption('Celsius', 'Celsius');
				dropDown.addOption('Fahrenheit', 'Fahrenheit');
				dropDown.setValue(this.plugin.settings.weatherTempUnits);
				dropDown.onChange(async (value) =>	{
					this.plugin.settings.weatherTempUnits = value;
					await this.plugin.saveSettings();
					this.plugin.ReloadData();
				});
			});

		new Setting(containerEl)
			.setName('Air Pressure Units')
			.setDesc('Choose between Inches and Mbr for weather output.')
			.setClass("setting")
			.addDropdown(dropDown => {
				dropDown.addOption('Inches', 'Inches');
				dropDown.addOption('Mbar', 'Mbar');
				dropDown.setValue(this.plugin.settings.weatherPressureUnits);
				dropDown.onChange(async (value) =>	{
					this.plugin.settings.weatherPressureUnits = value;
					await this.plugin.saveSettings();
				});
			});
	}
}

