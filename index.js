const express = require('express');
const db = require('./database');
const app = express();
app.use(express.json())

const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('./SuperHerosComplet.json', 'utf-8'));
const data = raw.heroes;
const insert = db.prepare(`INSERT INTO heroes (name, publisher, gender, race, power,
alignment, height_cm, weight_kg, createdAt)
VALUES (@name, @publisher, @gender, @race, @power, @alignment, @height_cm, @weight_kg,
@createdAt)`);

const count = db.prepare('SELECT COUNT(*) as total FROM heroes').get();
if (count.total === 0) {
  const now = new Date().toISOString();
  for (const hero of data) {
    insert.run({
      name: hero.name,
      publisher: hero.publisher,
      gender: hero.gender,
      race: hero.race,
      power: hero.power,
      alignment: hero.alignment,
      height_cm: parseInt(hero.height_cm),
      weight_kg: parseInt(hero.weight_kg),
      createdAt: now
    });
  }
  console.log('Données initiales importées.');
}

app.get('/heroes', (req, res) => {
  const heroes = db.prepare('SELECT * FROM heroes').all();
  res.json(heroes);
});

app.get('/heroes/:id', (req, res) => 
{
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(422).json({ error: 'ID invalide' });

  const hero = db
    .prepare("SELECT * FROM heroes WHERE id = ?")
    .get(id);
  if (!hero)
    return res.status(404).json({ error: 'Héros non trouvé' });

  res.json(hero);
});

app.get('/heroes/search', (req, res) => 
  {
  const q = req.query.q;
  if (!q)
    return res.status(400).json({ error: 'Paramètre q manquant' });

  const heroes = searchHeroesStmt.all(q);
  res.json(heroes);
});

app.get('/heroes', (req, res) => 
{
  const publisher = req.query.publisher;
  let heroes;
  if (publisher)
  {
    heroes = db
      .prepare("SELECT * FROM heroes WHERE publisher = ?")
      .all(publisher);
  }
  else
  {
    heroes = db
      .prepare('SELECT * FROM heroes')
      .all();
  }
  res.json(heroes);
});

app.get('/heroes/sorted', (req, res) => 
{
  const by = req.query.by;
  if (!by || by !== 'height')
    return res.status(400).json({ error: 'Paramètre by invalide (seul "height" autorisé)' });

  const heroes = db
    .prepare('SELECT * FROM heroes ORDER BY height_cm')
    .all();
  res.json(heroes);
});

app.post('/heroes', (req, res) => 
  {
  const { name, publisher, gender, race, power, alignment, height_cm, weight_kg } = req.body;
  if (!name || !publisher || !gender || !power || !alignment)
    return res.status(400).json({ error: 'Champs requis manquants' });

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO heroes
       (name,publisher,gender,race,power,alignment,height_cm,weight_kg,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?)`
    )
    .run(name, publisher, gender, race, power, alignment, height_cm, weight_kg, now);
});

app.delete('/heroes/:id', (req, res) => 
{
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(422).json({ error: 'ID invalide' });

  const info = db
    .prepare('DELETE FROM heroes WHERE id = ?')
    .run(id);
  if (info.changes === 0)
    return res.status(404).json({ error: 'Héros non trouvé' });
});

app.use((err, req, res, next) => 
{
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});