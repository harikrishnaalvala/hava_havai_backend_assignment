// app.js
const express = require('express');
const { sequelize, Country, City, Airport } = require('./models');
const xlsx = require('xlsx'); // Example library for reading Excel files

const app = express();
const port = process.env.PORT || 3000;

// Function to read and import data from spreadsheet
async function importDataFromSpreadsheet() {
  const workbook = xlsx.readFile('Database.xlsx');
  const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  for (const item of data) {
    // Example: Importing countries
    const country = await Country.create({
      name: item.name,
      country_code_two: item.country_code_two,
      country_code_three: item.country_code_three,
      mobile_code: item.mobile_code,
      continent_id: item.continent_id,
      flag_app: item.flag_app,
      country_flag: item.country_flag,
      createdAt: new Date(), // Adjust as per your data structure
      updatedAt: new Date() // Adjust as per your data structure
    });

    // Example: Importing cities
    const city = await City.create({
      name: item.name,
      alt_name: item.alt_name,
      country_id: country.id, // Assuming country_id is derived correctly
      is_active: item.is_active,
      lat: item.lat,
      long: item.long,
      createdAt: new Date(), // Adjust as per your data structure
      updatedAt: new Date() // Adjust as per your data structure
    });

    // Example: Importing airports
    await Airport.create({
      icao_code: item.icao_code,
      iata_code: item.iata_code,
      name: item.name,
      type: item.type,
      city_id: city.id, // Assuming city_id is derived correctly
      country_id: country.id, // Assuming country_id is derived correctly
      continent_id: item.continent_id,
      website_url: item.website_url,
      createdAt: new Date(), // Adjust as per your data structure
      updatedAt: new Date(), // Adjust as per your data structure
      latitude_deg: item.latitude_deg,
      longitude_deg: item.longitude_deg,
      elevation_ft: item.elevation_ft,
      wikipedia_link: item.wikipedia_link
    });
  }
}

// Route to trigger data import manually
app.get('/import-data', async (req, res) => {
  try {
    await importDataFromSpreadsheet();
    res.json({ message: 'Data imported successfully' });
  } catch (err) {
    console.error('Error importing data:', err);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Sync database and start server
sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});

app.get('/airport', async (req, res) => {
  const { iata_code } = req.query;

  try {
    const airport = await Airport.findOne({
      where: { iata_code },
      include: [
        {
          model: City,
          as: 'city',
          include: [
            {
              model: Country,
              as: 'country'
            }
          ]
        }
      ]
    });

    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }

    // Prepare the response object
    let response = {
      id: airport.id,
      icao_code: airport.icao_code,
      iata_code: airport.iata_code,
      name: airport.name,
      type: airport.type,
      latitude_deg: airport.latitude_deg,
      longitude_deg: airport.longitude_deg,
      elevation_ft: airport.elevation_ft,
      address: {
        city: airport.city ? {
          id: airport.city.id,
          name: airport.city.name,
          country_id: airport.city.country_id,
          is_active: airport.city.is_active,
          lat: airport.city.lat,
          long: airport.city.long
        } : null,
        country: airport.city && airport.city.country ? {
          id: airport.city.country.id,
          name: airport.city.country.name,
          country_code_two: airport.city.country.country_code_two,
          country_code_three: airport.city.country.country_code_three,
          mobile_code: airport.city.country.mobile_code,
          continent_id: airport.city.country.continent_id
        } : null
      }
    };

    return res.json({ airport: response });
  } catch (err) {
    console.error('Error fetching airport:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
