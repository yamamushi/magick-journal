import { App, Editor, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as SunCalc from 'suncalc';
interface MagickJournalSettings {
	defaultLocation: string;
	additionalDefaultFields: string;
}

const DEFAULT_SETTINGS: MagickJournalSettings = {
	defaultLocation: '',
	additionalDefaultFields: 'Other'
}

export default class MagickJournalPlugin extends Plugin {
	settings: MagickJournalSettings;
	AstroHeading = '';
	SolarData = {'moon_illumination': '', 'moon_phase': ''};
	Solis = '';
	MoonAstro = '';
	MoonPhase = '';
	DayOfWeek = '';
	WeatherDescription = '';
	Anno = '';
	TodayDateString = '';
	GeoLocation = {lat: '', lon: '', timezone: ''};
	ThelemicDate = '';

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
	ReloadEraLegis(){

		const params = {format: 'txt', tz: '', lang: '', location: ''};

		const tzOffset = new Date().getTimezoneOffset();
		const tzSign = (tzOffset <= 0) ? '' : '-';
		let isoOffset = String((Math.abs(tzOffset) / 60) * 100);
		for (let i = 4 - isoOffset.toString().length; i > 0 ; i--) {
			isoOffset = '0' + isoOffset;
		}
		params['tz'] = tzSign + isoOffset;
		params['lang'] = 'english';
		params['format'] = 'txt';
		const today = new Date();
		fetch('http://ip-api.com/json/')
			.then(response => response.json())
			.then(data => {
				if (data != null) {
					this.GeoLocation = data;
					params['location'] = this.GeoLocation.lat + ':' + this.GeoLocation.lon;
					this.ReloadSunMoonData(today);
					this.UpdateWeatherString();
					this.fetchEraLegis(params).then(data => {
						this.updateFormattedDate(data);
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
	updateFormattedDate(RawDate : string) {
		// replace the string 'Year' with 'Anno' in the string
		let formatted = RawDate.replace('Year', 'Anno');
		// replace 'of the New Aeon' with A.N.
		formatted = formatted.replace('of the New Aeon', 'A.N.');
		// Replace day of the week in English with full latin name and symbol
		formatted = formatted.replace('Sunday', 'dies Solis ☉');
		formatted = formatted.replace('Monday', 'dies Lunae ☽');
		formatted = formatted.replace('Tuesday', 'dies Martis ♂');
		formatted = formatted.replace('Wednesday', 'dies Mercurii ☿');
		formatted = formatted.replace('Thursday', 'dies Iovis ♃');
		formatted = formatted.replace('Friday', 'dies Veneris ♀');
		formatted = formatted.replace('Saturday', 'dies Saturni ♄');
		// Adds a corresponding astrological emoji after the zodiac word
		formatted = formatted.replace('Aries', 'Aries ♈');
		formatted = formatted.replace('Taurus', 'Taurus ♉');
		formatted = formatted.replace('Gemini', 'Gemini ♊');
		formatted = formatted.replace('Cancer', 'Cancer ♋');
		formatted = formatted.replace('Leo', 'Leo ♌');
		formatted = formatted.replace('Virgo', 'Virgo ♍');
		formatted = formatted.replace('Libra', 'Libra ♎');
		formatted = formatted.replace('Scorpio', 'Scorpio ♏');
		formatted = formatted.replace('Sagittarius', 'Sagittarius ♐');
		formatted = formatted.replace('Capricorn', 'Capricorn ♑');
		formatted = formatted.replace('Aquarius', 'Aquarius ♒');
		formatted = formatted.replace('Pisces', 'Pisces ♓');
		// Split formatted string into an array by : symbol
		const formattedArray = formatted.split(':');
		// solis is the first part of the array
		this.Solis = formattedArray[0];
		// moon is the second part of the array
		this.MoonAstro = formattedArray[1];
		// dayOfWeek is the second part of the array
		this.DayOfWeek = formattedArray[2].trim();
		// anno is the third part of the array
		this.Anno = formattedArray[3].trim();
		// Add ** to the front and back of anno
		this.Anno = '**' + this.Anno + '**';
		// First part of output is astrological with a newline after
		this.AstroHeading = this.Solis + ':' + this.MoonAstro + '\n';
	}

	getFullHeading():string {
		let output = this.AstroHeading;
		// Second part of output is anno with a newline after
		output += this.Anno + '\n';
		// Third part of output is dayOfWeek with a newline after
		output += this.DayOfWeek + '\n';
		// todaysDate is the current date in MM-DD-YYYY format
		this.UpdateTodaysDate();
		// Fourth part of output is todaysDate with 'e.v.' appended and a newline after
		output += this.TodayDateString+'\n';
		this.ThelemicDate = output;

		const time = '**Time:** '+this.formatAMPM(new Date())+'\n';
		const moon = '**Moon:** ' +this.MoonPhase+'\n';
		const location = '**Location:** ' + this.settings.defaultLocation + '\n';
		const currentWeather = '**Current Weather:** ' + this.WeatherDescription + '\n';
		output = output + time + moon + location + currentWeather;

		// For every additional field in the settings, add it to the output
		const additionalFields = this.settings.additionalDefaultFields.split(',');
		additionalFields.forEach(function(field) {
			output = output + '**' + field + ':** \n';
		});
		return output
	}

	UpdateTodaysDate() {
		this.TodayDateString = new Date().getDate() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getFullYear();
		this.TodayDateString = this.TodayDateString + ' e.v.\n';
	}

	UpdateWeatherString() {
    //https://api.open-meteo.com/v1/forecast?latitude=lat&
		// longitude=long&hourly=temperature_2m,pressure_msl,surface_pressure
		// &temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&
		// timezone=America%2FDenver&forecast_days=1
		const weatherParams = { latitude: '', longitude: '', hourly: '', temperature_unit: '',
			windspeed_unit: '', precipitation_unit: '', timezone: '', forecast_days: 0};
		weatherParams['latitude'] = this.GeoLocation.lat;
		weatherParams['longitude'] = this.GeoLocation.lon;
		weatherParams['hourly'] = 'temperature_2m,pressure_msl,surface_pressure,weathercode';
		weatherParams['temperature_unit'] = 'fahrenheit';
		weatherParams['windspeed_unit'] = 'mph';
		weatherParams['precipitation_unit'] = 'inch';
		weatherParams['timezone'] = this.GeoLocation.timezone;
		weatherParams['forecast_days'] = 1;

		const weatherURL = new URL('https://api.open-meteo.com/v1/forecast');
		// @ts-ignore
		Object.keys(weatherParams).forEach(key => weatherURL.searchParams.append(key, weatherParams[key]));
		fetch(weatherURL).then(response => response.json()).then(data => {
			const last = data['hourly']['temperature_2m'].length - 1;
			const Fahrenheit = data['hourly']['temperature_2m'][last];
			const Inches = this.MbrToInches(data['hourly']['pressure_msl'][last]).toFixed(2);
			const WeatherDescription = this.WeatherCodeToString(data['hourly']['weathercode'][last]);
			this.WeatherDescription = WeatherDescription + ', ' + Fahrenheit + '°F, ' + Inches + 'in';
		});
	}

	WeatherCodeToString(code : number) : string {
		/*
		Code	Description
0	Clear sky
1, 2, 3	Mainly clear, partly cloudy, and overcast
45, 48	Fog and depositing rime fog
51, 53, 55	Drizzle: Light, moderate, and dense intensity
56, 57	Freezing Drizzle: Light and dense intensity
61, 63, 65	Rain: Slight, moderate and heavy intensity
66, 67	Freezing Rain: Light and heavy intensity
71, 73, 75	Snow fall: Slight, moderate, and heavy intensity
77	Snow grains
80, 81, 82	Rain showers: Slight, moderate, and violent
85, 86	Snow showers slight and heavy
95 *	Thunderstorm: Slight or moderate
96, 99 *	Thunderstorm with slight and heavy hail
		 */
		const WeatherCodes = {
			0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
			45: 'Fog', 48: 'Rime Fog',
			51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
			56: 'Light Freezing Drizzle', 57: 'Dense Freezing Drizzle',
			61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
			66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
			71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
			77: 'Snow Grains',
			80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Heavy Rain Showers',
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
		this.ReloadEraLegis()

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('wand', 'Greet', (_: MouseEvent) => {
			// Called when the user clicks the icon.
			this.ReloadEraLegis();
			this.getFullHeading();
			new Notice(this.ThelemicDate.trim());
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Adds a command to insert thelemic date
		this.addCommand({
			id: "full-heading",
			name: "Insert Full Thelemic Date Header",
			editorCallback: (editor: Editor) => {
				this.ReloadEraLegis();
				const fullHeading = this.getFullHeading();
				editor.replaceRange(
					fullHeading,
					editor.getCursor()
				);
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
				this.ReloadEraLegis();
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
				const additionalFields = this.settings.additionalDefaultFields.split(',');
				let output = '';
				additionalFields.forEach(function(field) {
					output = output + '**' + field + ':** \n';
				});
				editor.replaceRange(
					output,
					editor.getCursor()
				);
				// Split additional fields by newline and count the number of lines
				const lineCount = output.split('\n').length;
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
					this.TodayDateString + '\n',
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
					this.Anno + '\n',
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
				editor.replaceRange(
					this.DayOfWeek + '\n',
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
		statusBarItemEl.setText(this.TodayDateString + this.DayOfWeek + this.Anno + this.AstroHeading + this.MoonPhase);

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

		new Setting(containerEl)
			.setName('Default Location')
			.setDesc('Default location for header')
			.addText(text => text
				.setPlaceholder('Enter a location')
				.setValue(this.plugin.settings.defaultLocation)
				.onChange(async (value) => {
					this.plugin.settings.defaultLocation = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Additional Default Fields')
			.setDesc('Additional Fields to Add to Header separated by comma')
			.addText(text => text
				.setPlaceholder('Enter additional fields separated by a comma')
				.setValue(this.plugin.settings.additionalDefaultFields)
				.onChange(async (value) => {
					this.plugin.settings.additionalDefaultFields = value;
					await this.plugin.saveSettings();
				}));
	}
}

