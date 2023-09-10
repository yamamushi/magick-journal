# Magick Journal for Obsidian

This plugin adds a number of tools for practitioners of Magick (Specifically Thelema) to Obsidian to aid in journaling.

* [Commands](#commands)
* [Settings](#settings)
* [About](#about)
* [Contact](#contact)

## Commands

It's recommended to add hotkeys for these commands if you plan on using them often. 

* **full-heading**: Inserts the full heading as configured in the options for the plugin

Example Output:

	☉︎ in 15° Virgo ♍ : ☽︎ in 29° Gemini ♊
	
	**Anno Ⅴ.ⅰⅹ A.N.**
	dies Iovis ♃
	7-9-2023 e.v.
	
	**10:56 PM MDT**
	**Moon:** Waning Crescent 38%
	**Location:** Home, Colorado Springs CO
	**Current Weather:** Clear Sky, 61.4°F, 29.83in

* **new-entry**: Inserts a new journal entry with the configured [new entry](#entries) fields.

Example Output:

	☉︎ in 15° Virgo ♍ : ☽︎ in 29° Gemini ♊
	**10:56 PM MDT**
	**Moon:** Waning Crescent 38%
	**Current Weather:** Clear Sky, 61.4°F, 29.83in

* **insert-astro**: Inserts the astrological header with the Sun and Moon positions.

* **insert-checklist**: Inserts the configured [checklist](#checklist) into the document.

* **insert-time**: Inserts the current time and timezone

* **insert-extra-fields**: Inserts the extra fields as configured in the options for the plugin.

* **insert-date-ev**: Inserts the current EV date.

* **insert-new-aeon-year**: Inserts the current New Aeon year.

* **insert-day**: Inserts the latin day of the week.

* **insert-weather**: Inserts current local weather conditions, temperature and air pressure.

* **insert-moon**: Inserts current phase of the moon and illumination percentage.

* **insert-resh**: Inserts the Resh schedule for today.

Example Output:

	**Resh Times for Sep 10, 2023**

     Sunrise: 6:27 AM MDT
     Noon: 12:56 PM MDT
     Sunset: 7:26 PM MDT
     Midnight: 12:56 AM MDT

## Settings

- [Geolocation](#geolocation)
- [Liber Resh Clock](#liber-resh-clock)
- [Default Entries](#default-entries)
- [Header](#header)
- [Entries](#entries)
- [Checklist](#checklist)
- [Magick Date](#magick-date)
- [Astro](#astro)
- [Weather](#weather)
- [Time](#time)
- [Day](#day)
- [Date](#date)

### Geolocation

* **IP Geolocation**: Whether to use IP geolocation to determine location for weather and Astrological lookups. If disabled, the configured coordinates will be used.

* **Geolocation Coordinates**: The coordinates to use for weather lookups if IP geolocation is disabled. This should be in the format `latitude,longitude` (e.g. `38.8339,-104.8214`).

### Liber Resh Clock

* **Enable Liber Resh Clock**: Whether to enable the Liber Resh Clock statusbar. This will tell you when the next Resh is, and when the previous Resh was.

* **Use Altitude in Resh Calculations**: Whether to use the configured altitude in the Resh calculations. If disabled, the altitude will be ignored.

* **Custom Altitude**: The altitude to use for Resh calculations. This should be in meters.

* **Display Upcoming Resh Name**: Whether to display the name of the upcoming Resh in the statusbar.

* **Display Upcoming Countdown**: Whether to display the countdown to the upcoming Resh in the statusbar.

* **Display Upcoming Time**: Whether to display the time of the upcoming Resh in the statusbar.

* **Display Previous Resh Name**: Whether to display the name of the previous Resh in the statusbar.

* **Display Previous Resh Time**: Whether to display the time of the previous Resh in the statusbar.

### Default Entries

* **Default Location**: The default location to use to populate the "Default Location" field in the full header output. This does not affect weather lookups, which are always performed based on your location.

### Header 

* **Header Fields**: Comma separated fields to populate full header with. Options are:

  * **Astro**: To insert the current astrological header from EraLegis
  * **Anno**: To insert the current New Aeon date
  * **Day**: To insert the current latin day of the week
  * **EV**: To insert the current common era date 
  * **Time**: To insert the current local time and timezone
  * **Moon**: To insert the current phase of the moon and illumination percentage
  * **Location**: To insert the configured Default Location
  * **Weather**: To insert the current local weather
  * **Checklist**: To insert the configured [checklist](#checklist)
  * **Resh**: To insert the Resh schedule for today.
  * **Blank**: To insert a blank line.

  **Unrecognized options will be inserted as additional fields.**

Example Configuration:

  	Astro, Anno, Day, EV, Blank, Time, Moon, Location, Weather, Resh, Other Field 1, Other Field 2

### Entries

* **New Entry Template**: Comma separated fields to populate new entries with. Available options are the same as for the [header](#header) fields.

Example Configuration:

	Astro, Time, Moon, Weather

### Checklist

To use the checklist, you can either use the `insert-checklist` command, or you can add "Checklist" to the [Header](#header) fields.

* **Checklist Items**: Comma separated items to insert into the checklist. These will be inserted in the order they are configured as well as their casing. 

Example Configuration:

  	Morning Resh, Yoga, Meditation, Noon Resh, Sunset Resh, Prepare Dinner, Reading Time, Midnight Resh

Example Output:

    - [ ] Morning Resh
    - [ ] Yoga
    - [ ] Meditation
    - [ ] Noon Resh
    - [ ] Sunset Resh
    - [ ] Prepare Dinner
    - [ ] Reading Time
    - [ ] Midnight Resh


### Magick Date

* **Magick Date Fields**: Comma separated fields to populate the magick date with. Available options are the same as for the [header](#header) fields.

Example Configuration:

	Astro, Anno, Day, EV, Time

### Astro

* **Emojis in Astro Field**: Whether to use emojis in the astrological header.

* **English Names in Astro Field**: Whether to use English sign names in the astrological header.

### Weather

* **Enable Weather Lookup**: Enable or disable weather lookups.

* **Include Weather Description**: Whether to include the weather description in the weather field.

* **Include Temperature**: Whether to include the temperature in the weather field.

* **Include Air Pressure**: Whether to include the air pressure in the weather field.

* **Temperature Precision**: Number of decimal places to display for temperature.

* **Temperature Units**: Units to display temperature in, Celsius or Fahrenheit.

* **Air Pressure Units**: Units to display air pressure in, Inches or Millibars.

### Time

* **Timezone in Time Field**: Whether to display the timezone in the time field.

### Day

* **Planet Symbols in Day Field**: Whether to display the planet symbols in the day field.

* **Use Latin Day Names**: Whether to display the day of the week in Latin.

### Date

* **Use E.V. Date**: Whether to append E.V. to the common era date.

* **Date Format**: The format to use for the common era date, such as `MM-DD-YYYY` or `DD-MM-YYYY`.

* **Date Separator**: The separator to use between date fields, such as `-` or `/`.

* **Pad Date with Zeros**: Whether to pad the date with zeros, such as `01-01-2021` instead of `1-1-2021`.


## About

magick-journal pulls the current astrological correspondence and Thelemic date from https://eralegis.info/, the current weather from https://open-meteo.com/, and GeoLocation data from http://ip-api.com/.

All the services are provided free of charge, but if you find this plugin useful, please consider donating to them (especially EraLegis ❤️).

If you're wondering why it's spelled "Magick" instead of "Magic": https://simple.wikipedia.org/wiki/Magick

More information about Resh can be found here: http://www.thelemapedia.org/index.php/Liber_Resh

## Contact

You can contact me via Discord @ **yamamushi** or on the /r/occult Discord server @ https://discord.gg/r-occult
93/93
