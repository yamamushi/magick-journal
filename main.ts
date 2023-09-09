import {App, Editor, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as SunCalc from 'suncalc';

interface MagickJournalSettings {
	defaultLocation: string;
	headerFields: string;
	magickDateFields: string,
	astrologyIncludeEmoji: boolean,
	astrologyIncludeEnglish: boolean,
	useGeolocation: boolean,
	customLatLonCoords: string,
	weatherTempDecimalPlaces: string,
	weatherTempUnits: string,
	weatherPressureUnits: string,
	weatherShowDescription: boolean,
	weatherShowTemp: boolean,
	weatherShowPressure: boolean,
	timeZoneInTimeField: boolean,
	symbolInDayField: boolean,
	useLatinNamesForDays: boolean,
	useEVInDateField: boolean,
	dateFormat: string,
	padDate: boolean,
	dateSeparator: string,
	reshStatusBar: boolean,
	checkListItems: string,
}

const DEFAULT_SETTINGS: MagickJournalSettings = {
	defaultLocation: '',
	headerFields: 'Astro, Anno, Day, EV, Blank, Time, Moon, Location, Weather, Other',
	magickDateFields: 'Astro, Anno, Day, EV, Time',
	astrologyIncludeEmoji: true,
	astrologyIncludeEnglish: true,
	useGeolocation: true,
	customLatLonCoords: '',
	weatherTempDecimalPlaces: '2',
	weatherTempUnits: 'fahrenheit',
	weatherPressureUnits: 'inches',
	weatherShowDescription: true,
	weatherShowTemp: true,
	weatherShowPressure: true,
	timeZoneInTimeField: true,
	symbolInDayField: true,
	useLatinNamesForDays: true,
	useEVInDateField: true,
	dateFormat: 'MM-DD-YYYY',
	padDate: true,
	dateSeparator: '-',
	reshStatusBar: false,
	checkListItems: '',
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
	TodaysDate = '';
	GeoLocation = {lat: '', lon: '', timezone: ''};
	statusBarItemEl = this.addStatusBarItem();
	lastReshNotfied = '';

	reloadSunMoonData(date : Date){
		this.SolarData['moon_illumination'] = (SunCalc.getMoonIllumination(date)['fraction']*100).toFixed(0);
		this.SolarData['moon_phase'] = this.moonPhaseToName(SunCalc.getMoonIllumination(date)['phase']);
		this.MoonPhase = this.SolarData['moon_phase'] + ' ' + this.SolarData['moon_illumination'] + '%';
	}

	moonPhaseToName(phase : number) : string {
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
		if (phase < 0.1) return 'New Moon';
		if (phase < 0.24) return 'Waxing Crescent';
		if (phase < 0.26) return 'First Quarter';
		if (phase < 0.49) return 'Waxing Gibbous';
		if (phase < 0.51) return 'Full Moon';
		if (phase < 0.74) return 'Waning Gibbous';
		if (phase < 0.751) return 'Last Quarter';
		if (phase < 1) return 'Waning Crescent';
		return '';
	}

	reloadData(){
		const params = {format: 'txt', tz: '', lang: 'english', location: '', emojis: false};

		const tzOffset = new Date().getTimezoneOffset();
		const tzSign = tzOffset <= 0 ? '' : '-';
		const isoOffset = String(Math.abs(tzOffset) / 60).padStart(4, '0');
		params['tz'] = tzSign + isoOffset;

		if(this.settings.useGeolocation) {
			fetch('http://ip-api.com/json/')
				.then(response => response.json())
				.then(data => {
					if (data != null) {
						this.GeoLocation = data;
						params['location'] = this.GeoLocation.lat + ':' + this.GeoLocation.lon;
						this.reloadSunMoonData(new Date());
						this.updateWeatherDescription();
						this.fetchEraLegis(params).then(data => {
							this.updateEraLegisVars(data);
						});
					}
				})
				.catch(error => {
					console.error('Error fetching or parsing data:', error);
				});
		} else {
			const geoFields = this.settings.customLatLonCoords.split(',');
			params['location'] = geoFields[0].trim() + ':' + geoFields[1].trim();
			this.reloadSunMoonData(new Date());
			this.updateWeatherDescription();
			this.fetchEraLegis(params).then(data => {
				this.updateEraLegisVars(data);
			});
		}
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

	getLatinDayOfWeek() {
		const daysMapping = {
			'Sunday': { name: 'dies Solis', symbol: '☉' },
			'Monday': { name: 'dies Lunae', symbol: '☽' },
			'Tuesday': { name: 'dies Martis', symbol: '♂' },
			'Wednesday': { name: 'dies Mercurii', symbol: '☿' },
			'Thursday': { name: 'dies Iovis', symbol: '♃' },
			'Friday': { name: 'dies Veneris', symbol: '♀' },
			'Saturday': { name: 'dies Saturni', symbol: '♄' }
		};

		const englishDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
		let currentDay = '';
		// @ts-ignore
		currentDay = this.settings.useLatinNamesForDays && daysMapping[englishDay]
			// @ts-ignore
			? daysMapping[englishDay].name
			: englishDay;
		currentDay += ' ';

		// @ts-ignore
		currentDay += (this.settings.symbolInDayField && daysMapping[englishDay])
			// @ts-ignore
			? daysMapping[englishDay].symbol
			: '';

		this.LatinDayOfWeek = currentDay;
		return this.LatinDayOfWeek;
	}
	updateAstroSigns(input: string): string {
		const astroSignsMapping = {
			'Aries': '♈',
			'Taurus': '♉',
			'Gemini': '♊',
			'Cancer': '♋',
			'Leo': '♌',
			'Virgo': '♍',
			'Libra': '♎',
			'Scorpio': '♏',
			'Sagittarius': '♐',
			'Capricorn': '♑',
			'Aquarius': '♒',
			'Pisces': '♓'
		};

		for (const sign in astroSignsMapping) {
			if (input.includes(sign)) {
				const output = [
					this.settings.astrologyIncludeEnglish ? sign : '',
					// @ts-ignore
					this.settings.astrologyIncludeEmoji ? astroSignsMapping[sign] : ''
				].join(' ').trim();

				input = input.replace(sign, output);
			}
		}
		return input;
	}

	updateEraLegisVars(EraLegisOutput : string) {
		let formatted = EraLegisOutput.replace('Year', 'Anno');
		formatted = formatted.replace('of the New Aeon', 'A.N.');
		// Replaces astro signs string with string according to settings
		formatted = this.updateAstroSigns(formatted);
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

	getMagickDate(): string {
		// First we get the default fields from the settings
		const magickDateFields = this.settings.magickDateFields.toLowerCase().split(',');
		return this.parseFieldListIntoString(magickDateFields).replace(/\*/g, '');
	}

	parseCheckList(input: string): string {
		let output = ''
		// First we get the default fields from the settings
		const defaultFields = this.settings.checkListItems.split(',');
		// Then we loop through each field and add it to the output
		defaultFields.forEach(function(field) {
			field = field.trim();
			output += '- [ ] ' + field.split(' ')
				//.map(s => s.charAt(0).toUpperCase() + s.substring(1))
				.join(' ') + '\n';
		}, this);
		return output
	}

	parseFieldListIntoString(input: string[]): string {
		const mappings = {
			astro: this.AstroHeading,
			anno: this.NewAeonYear,
			day: this.getLatinDayOfWeek(),
			ev: this.getEVDate(),
			time: '**Time:** ' + this.formatAMPM(new Date()),
			moon: '**Moon:** ' + this.MoonPhase,
			location: '**Location:** ' + this.settings.defaultLocation,
			weather: '**Current Weather:** ' + this.WeatherDescription,
			checklist: this.parseCheckList(this.settings.checkListItems),
			blank: ''
		};

		return input.map((field) => {
			field = field.trim();

			if (mappings.hasOwnProperty(field)) {
				// @ts-ignore
				return mappings[field];
			}

			const capitalizedField = field.split(' ')
				.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
				.join(' ');

			return '**' + capitalizedField + ':**';

		}).join('\n');
	}

	getFullHeading():string {
		// First we get the default fields from the settings
		const defaultFields = this.settings.headerFields.toLowerCase().split(',');
		// Then we loop through each field and add it to the output
		return this.parseFieldListIntoString(defaultFields);
	}

	getExtraFields():string {
		let output = ''
		// First we get the default fields from the settings
		const defaultFields = this.settings.headerFields.toLowerCase().split(',');
		// Then we loop through each field and add it to the output
		defaultFields.forEach(function(field) {
			field = field.trim();
			const predefinedFields = ["astro", "anno", "day", "ev", "time", "moon", "location", "weather", "checklist", "blank"];
			if (!predefinedFields.includes(field)) {
				output += '**' + field.split(' ')
					.map(s => s.charAt(0).toUpperCase() + s.substring(1))
					.join(' ') + ':** \n';
			}
		}, this);
		return output
	}

	getEVDate() {
		const today = new Date();
		let components = {}

		if (this.settings.padDate) {
			components = {
				DD: String(today.getDate()).padStart(2, '0'),
				MM: String(today.getMonth() + 1).padStart(2, '0'),  // Months are 0-based
				YYYY: String(today.getFullYear())
			};
		} else {
			components = {
				DD: String(today.getDate()),
				MM: String(today.getMonth() + 1),  // Months are 0-based
				YYYY: String(today.getFullYear())
			};
		}

		// @ts-ignore
		this.TodaysDate = this.settings.dateFormat.split('-').map(part => components[part]).join(this.settings.dateSeparator);
		this.TodaysDate += this.settings.useEVInDateField ? ' e.v.' : '';

		return this.TodaysDate
	}

	updateWeatherDescription(): string {
		const weatherParams = { latitude: '', longitude: '',
			hourly: 'temperature_2m,pressure_msl,surface_pressure,weathercode', temperature_unit: '',
			windspeed_unit: 'mph', precipitation_unit: '', timezone: '', forecast_days: 1, current_weather: 'true'};
		weatherParams['latitude'] = this.settings.useGeolocation ? this.GeoLocation.lat : this.settings.customLatLonCoords.split(',')[0].trim();
		weatherParams['longitude'] = this.settings.useGeolocation ? this.GeoLocation.lon : this.settings.customLatLonCoords.split(',')[1].trim();

		weatherParams['temperature_unit'] = this.settings.weatherTempUnits.toLowerCase();
		weatherParams['windspeed_unit'] = 'mph';
		weatherParams['precipitation_unit'] = 'inch';
		weatherParams['timezone'] = this.GeoLocation.timezone;

		const weatherURL = new URL('https://api.open-meteo.com/v1/forecast');
		//console.log(weatherURL)
		// @ts-ignore
		Object.keys(weatherParams).forEach(key => weatherURL.searchParams.append(key, weatherParams[key]));
		fetch(weatherURL).then(response => response.json()).then(data => {
			let temperature = data['current_weather']['temperature'].toFixed(Number(this.settings.weatherTempDecimalPlaces));
			const currentTime = data['current_weather']['time'];
			const index = data['hourly']['time'].indexOf(currentTime).toString();

			const pressureInMbar = data['hourly']['pressure_msl'][index].toFixed(2);
			const pressure = this.settings.weatherPressureUnits.toLowerCase() === 'mbar'
				? `${pressureInMbar}mbar`
				: `${this.mbarToInches(pressureInMbar).toFixed(2)}in`;

			const description = this.weatherCodeToString(data['current_weather']['weathercode']);
			const temperatureUnit = this.settings.weatherTempUnits.toLowerCase() === 'celsius' ? '°C' : '°F';
			temperature += temperatureUnit;

			const options = [
				this.settings.weatherShowDescription ? description : null,
				this.settings.weatherShowTemp ? temperature : null,
				this.settings.weatherShowPressure ? pressure : null
			];

			this.WeatherDescription = options.filter(Boolean).join(', ')
		});
		return this.WeatherDescription;
	}

	weatherCodeToString(code : number) : string {
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

	mbarToInches(mbr : number) : number {
		return mbr * 0.02953;
	}

	formatAMPM(date : Date) {
		let hours = date.getHours();
		let minutes  = String(date.getMinutes());
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = (hours % 12) || 12;
		minutes = Number(minutes) < 10 ? '0'+minutes : minutes;
		// tz is the current timezone in word format
		const tz = new Date()
			.toLocaleDateString('en-US', { day: '2-digit', timeZoneName: 'short',}).slice(4)
		return hours + ':' + minutes + ' ' + ampm + (this.settings.timeZoneInTimeField ? ' ' + tz : '');
	}

	countdownToString(reshTime: number) : string  {
		const now = new Date();
		const nowTime = now.getTime();
		const timeUntil = reshTime - nowTime;

		const hours = Math.floor( timeUntil / (1000 * 60 * 60));
		const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);

		return hours + "h " + minutes + "m " + seconds + "s ";
	}

	liberReshHandler() {
		if (!this.settings.reshStatusBar) {
			this.statusBarItemEl.setText('');
			return;
		}
		let todayTimes: SunCalc.GetTimesResult;
		let tomorrowTimes: SunCalc.GetTimesResult;

		if (this.settings.useGeolocation) {
			todayTimes = SunCalc.getTimes(new Date(), Number(this.GeoLocation.lat), Number(this.GeoLocation.lon));
			// and tomorrow
			tomorrowTimes = SunCalc.getTimes(new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
				Number(this.GeoLocation.lat), Number(this.GeoLocation.lon));
		} else {
			const geoFields = this.settings.customLatLonCoords.split(',');
			todayTimes = SunCalc.getTimes(new Date(), Number(geoFields[0].trim()), Number(geoFields[1].trim()));
			// and tomorrow
			tomorrowTimes = SunCalc.getTimes(new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
				Number(geoFields[0].trim()), Number(geoFields[1].trim()));
		}
		const sunrise = todayTimes.sunrise;
		const noon = todayTimes.solarNoon;
		const sunset = todayTimes.sunset;
		const midnight = todayTimes.nadir;
		const tomorrowMidnight = tomorrowTimes.nadir;

		const now = new Date();
		const nowTime = now.getTime();

		if (nowTime < sunrise.getTime()) {
			const reshTime = sunrise.getTime();
			const timeString = this.countdownToString(reshTime)
			this.statusBarItemEl.setText('Sunrise Resh in ' + timeString + '('+ this.formatAMPM(sunrise) +'), Previous (Midnight): ' + this.formatAMPM(midnight));
		} else if (nowTime < noon.getTime()) {
			const reshTime = noon.getTime();
			const timeString = this.countdownToString(reshTime)
			this.statusBarItemEl.setText('Noon Resh in ' + timeString + '('+ this.formatAMPM(noon) +'), Previous (Sunrise): ' + this.formatAMPM(sunrise));
		} else if (nowTime < sunset.getTime()) {
			const reshTime = sunset.getTime();
			const timeString = this.countdownToString(reshTime)
			this.statusBarItemEl.setText('Sunset Resh in ' + timeString + '('+ this.formatAMPM(sunset) +'), Previous (Noon): ' + this.formatAMPM(noon));
		} else if (nowTime < tomorrowMidnight.getTime()) {
			const reshTime = tomorrowMidnight.getTime();
			const timeString = this.countdownToString(reshTime)
			//const timeSinceLast = nowTime - sunset.getTime();
			this.statusBarItemEl.setText('Midnight Resh in ' + timeString + '('+ this.formatAMPM(midnight) +'), Previous (Sunset): ' + this.formatAMPM(midnight));
		}
		//new Notice(this.getMagickDate());
	}

	async onload() {
		await this.loadSettings();
		this.reloadData()

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('wand', 'Greet', (_: MouseEvent) => {
			// Called when the user clicks the icon.
			this.reloadData();
			this.getFullHeading();
			new Notice(this.getMagickDate());
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Adds a command to insert thelemic date
		this.addCommand({
			id: "full-heading",
			name: "Insert Full Journal Heading",
			editorCallback: (editor: Editor) => {
				this.reloadData();
				const fullHeading = this.getFullHeading();
				editor.replaceRange(
					fullHeading + '  ',
					editor.getCursor()
				)
				const lines = fullHeading.split('\n');
				const lineCount = fullHeading.split('\n').length;
				const lastLineLength = lines[lines.length - 1].length;
				editor.setCursor(editor.getCursor().line + lineCount, lastLineLength);
			},
		});

		// Adds a command to insert the astrological heading
		this.addCommand({
			id: "insert-astro",
			name: "Insert Astrological Info",
			editorCallback: (editor: Editor) => {
				this.reloadData();
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
				const additionalFields = this.getExtraFields();
				editor.replaceRange(
					additionalFields,
					editor.getCursor()
				);
				// Split additional fields by newline and count the number of lines
				const lineCount = additionalFields.split('\n').length;
				editor.setCursor(editor.getCursor().line + lineCount + 1);
			}
		},);

		this.addCommand({
			id: "insert-checklist",
			name: "Insert Checklist",
			editorCallback: (editor: Editor) => {
				const checklistItems = this.parseCheckList(this.settings.checkListItems);
				editor.replaceRange(
					checklistItems,
					editor.getCursor()
				);
				// Split additional fields by newline and count the number of lines
				const lineCount = checklistItems.split('\n').length;
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
					this.getEVDate() + '\n',
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
				editor.replaceRange(
					this.getLatinDayOfWeek() + '\n',
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
				this.reloadData();
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
				this.reloadSunMoonData(new Date());
				editor.replaceRange(
					'**Moon:** ' + this.MoonPhase + '\n',
					editor.getCursor()
				);
				editor.setCursor(editor.getCursor().line + 1);
			},
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem();
		//statusBarItemEl.setText(this.TodaysDate + this.LatinDayOfWeek + this.NewAeonYear + this.AstroHeading + this.MoonPhase);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MagickJournalSettingsTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		const second = 1000;
		this.registerInterval(window.setInterval(() => this.liberReshHandler(), 1*second));
	}

	onunload() {
		this.statusBarItemEl.setText('');
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

		const geolocation_settings = containerEl.createEl("div");
		geolocation_settings.createEl("div", { text: "Geolocation", cls: "settings_section_title" });
		geolocation_settings.createEl("small", { text: "Geolocation Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('IP Geolocation')
			.setDesc('Use IP based geolocation, disable to use manually entered coordinates.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Use manual weather geolocation instead of IP based geolocation.')
				.setValue(this.plugin.settings.useGeolocation)
				.onChange(async (value) => {
					this.plugin.settings.useGeolocation = value;
					await this.plugin.saveSettings();
					this.plugin.reloadData();
				}));

		new Setting(containerEl)
			.setName('Geolocation Coordinates')
			.setDesc('Manually enter your geolocation latitude and longitude, comma separated, for more accurate weather data. ie 40.7128,-74.0060')
			.setClass("setting")
			.addText(textarea => textarea
				.setValue(this.plugin.settings.customLatLonCoords)
				.onChange(async (value) => {
					this.plugin.settings.customLatLonCoords = value;
					this.plugin.updateWeatherDescription();
					await this.plugin.saveSettings();
				}).then(() => {this.plugin.reloadData()}));

		containerEl.createEl("br");
		containerEl.createEl("br");


		const resh_settings = containerEl.createEl("div");//, { cls: "settings_section" });
		resh_settings.createEl("div", { text: "Liber Resh", cls: "settings_section_title" });
		resh_settings.createEl("small", { text: "Settings for the Liber Resh Clock statusbar", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Enable Liber Resh Statusbar')
			.setDesc('Enables the Liber Resh Clock statusbar.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Enable the Liber Resh Clock statusbar.')
				.setValue(this.plugin.settings.reshStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.reshStatusBar = value;
					await this.plugin.saveSettings();
					this.plugin.reloadData();
				}));

		containerEl.createEl("br");
		containerEl.createEl("br");


		const entry_settings = containerEl.createEl("div");//, { cls: "settings_section" });
		entry_settings.createEl("div", { text: "Default Entries", cls: "settings_section_title" });
		entry_settings.createEl("small", { text: "Defaults for Auto-Populated Entries", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Default Location')
			.setDesc('Default location for use in the journal header.')
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
		header_field_settings.createEl("div", { text: "Header", cls: "settings_section_title" });
		header_field_settings.createEl("small", { text: "Header settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Header Fields')
			.setDesc('Comma separated fields to populate full header with.' +
				' Options are: Astro, Anno, Day, EV, Time, Moon, Location, Weather, Checklist, and Blank to insert a blank line.' +
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


		const checklist_settings = containerEl.createEl("div");//, { cls: "settings_section" });
		checklist_settings.createEl("div", { text: "Checklist", cls: "settings_section_title" });
		checklist_settings.createEl("small", { text: "Settings for the Checklist feature", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Checklist Items')
			.setDesc('Comma separated items to populate a checklist with.')
			.setClass("setting")
			.addTextArea(textarea => textarea
				.setPlaceholder('Enter default items separated by a comma.')
				.setValue(this.plugin.settings.checkListItems)
				.onChange(async (value) => {
					this.plugin.settings.checkListItems = value;
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
		astro_field_settings.createEl("div", { text: "Astrology", cls: "settings_section_title" });
		astro_field_settings.createEl("small", { text: "Astrology Settings", cls: "settings_section_description" });

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
					this.plugin.reloadData();
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
					this.plugin.reloadData();
				}));


		containerEl.createEl("br");
		containerEl.createEl("br");


		const weather_field_settings = containerEl.createEl("div");
		weather_field_settings.createEl("div", { text: "Weather", cls: "settings_section_title" });
		weather_field_settings.createEl("small", { text: "Weather Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Include Weather Description')
			.setDesc('Include the weather description in the weather field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include the weather description in the weather field.')
				.setValue(this.plugin.settings.weatherShowDescription)
				.onChange(async (value) => {
					this.plugin.settings.weatherShowDescription = value;
					await this.plugin.saveSettings();
					this.plugin.reloadData();
				}));

		new Setting(containerEl)
			.setName('Include Temperature')
			.setDesc('Include the temperature in weather field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include the temperature description in weather field.')
				.setValue(this.plugin.settings.weatherShowTemp)
				.onChange(async (value) => {
					this.plugin.settings.weatherShowTemp = value;
					await this.plugin.saveSettings();
					this.plugin.reloadData();
				}));

		new Setting(containerEl)
			.setName('Include Pressure')
			.setDesc('Include air pressure in the weather field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include air pressure in the weather field.')
				.setValue(this.plugin.settings.weatherShowPressure)
				.onChange(async (value) => {
					this.plugin.settings.weatherShowPressure = value;
					await this.plugin.saveSettings();
					this.plugin.reloadData();
				}));


		new Setting(containerEl)
			.setName('Temperature Precision')
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
					this.plugin.reloadData();
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


		containerEl.createEl("br");
		containerEl.createEl("br");


		const time_field_settings = containerEl.createEl("div");
		time_field_settings.createEl("div", { text: "Time", cls: "settings_section_title" });
		time_field_settings.createEl("small", { text: "Time Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Timezone in Time Field')
			.setDesc('Include time timezone in the time field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include emojis in the astrology field.')
				.setValue(this.plugin.settings.timeZoneInTimeField)
				.onChange(async (value) => {
					this.plugin.settings.timeZoneInTimeField = value;
					await this.plugin.saveSettings();
				}));


		containerEl.createEl("br");
		containerEl.createEl("br");


		const day_field_settings = containerEl.createEl("div");
		day_field_settings.createEl("div", { text: "Day", cls: "settings_section_title" });
		day_field_settings.createEl("small", { text: "Day Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Planet Symbols in Day Field')
			.setDesc('Include the planetary symbols in the day field.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Include the planetary symbols in the day field.')
				.setValue(this.plugin.settings.symbolInDayField)
				.onChange(async (value) => {
					this.plugin.settings.symbolInDayField = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Use Latin Day Names')
			.setDesc('Use latin day names instead of english.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Use latin day names instead of english.')
				.setValue(this.plugin.settings.useLatinNamesForDays)
				.onChange(async (value) => {
					this.plugin.settings.useLatinNamesForDays = value;
					await this.plugin.saveSettings();
				}));


		containerEl.createEl("br");
		containerEl.createEl("br");


		const date_field_settings = containerEl.createEl("div");
		date_field_settings.createEl("div", { text: "Date", cls: "settings_section_title" });
		date_field_settings.createEl("small", { text: "Date Settings", cls: "settings_section_description" });

		new Setting(containerEl)
			.setName('Use E.V. Date')
			.setDesc('Use era vulgaris (common era) in date')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Use era vulgaris (common era) in date')
				.setValue(this.plugin.settings.useEVInDateField)
				.onChange(async (value) => {
					this.plugin.settings.useEVInDateField = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Format for the date in MM-DD-YYYY, ie DD-MM-YYYY, YYYY-DD-MM. etc.')
			.setClass("setting")
			.addText(text => text
				.setPlaceholder('Format for the date in MM-DD-YYYY')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Date Separator')
			.setDesc('Date separator, ie / or -, etc.')
			.setClass("setting")
			.addText(text => text
				.setPlaceholder('Date separator, ie / or -')
				.setValue(this.plugin.settings.dateSeparator)
				.onChange(async (value) => {
					this.plugin.settings.dateSeparator = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Pad Date with Zeros')
			.setDesc('Pad the date with zeros, ie 01-01-2021 instead of 1-1-2021.')
			.setClass("setting")
			.addToggle(textarea => textarea
				.setTooltip('Pad the date with zeros, ie 01-01-2021 instead of 1-1-2021.')
				.setValue(this.plugin.settings.padDate)
				.onChange(async (value) => {
					this.plugin.settings.padDate = value;
					await this.plugin.saveSettings();
				}));

	}
}

