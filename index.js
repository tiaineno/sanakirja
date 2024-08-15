const express = require('express')
const app = express()
require('dotenv').config()
const Word = require('./models/word')
const morgan = require('morgan')

app.use(express.static('dist'))
app.use(express.json())

morgan.token('post', (request) => {
  if (['POST', 'PUT'].includes(request.method)){
    return JSON.stringify(request.body)
  }
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :post'))

const cors = require('cors')

app.use(cors())

app.get('/api/words', (request, response, next) => {
  Word.find({}).then(p => {
    if (p) {
      response.json(p)
    } else {
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.get('/api/words/:id', (request, response, next) => {
  Word.findById(request.params.id).then(p => {
    if (p) {
      response.json(p)
    } else {
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.delete('/api/words/:id', (request, response, next) => {
  Word.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/words', (request, response, next) => {
  const body = request.body

  if (!body.suomi) {
    return response.status(400).json({
      error: 'suomi missing'
    })
  }

  if (!body.jyrilassi) {
    return response.status(400).json({
      error: 'jyrilassi missing'
    })
  }

  if (!body.esimerkki) {
    return response.status(400).json({
      error: 'esimerkki missing'
    })
  }

  Word.findOne({ jyrilassi: body.jyrilassi })
    .then(existingWord => {
      if (existingWord) {
        return response.status(400).json({
          error: 'This word already exists'
        })
      }

      const word = new Word({
        suomi: body.suomi,
        jyrilassi: body.jyrilassi,
        esimerkki: body.esimerkki
      })

      return word.save()
        .then(savedWord => {
          response.json(savedWord)
        })
    })
    .catch(error => next(error))
})

app.put('/api/words/:id', (request, response, next) => {

  const { suomi, jyrilassi, esimerkki } = request.body

  Word.findByIdAndUpdate(
    request.params.id,
    { suomi, jyrilassi, esimerkki },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(p => {
      response.json(p)
    })
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})