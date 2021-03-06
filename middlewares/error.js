const { ApiError } = require('../helpers')
const { nodeEnv } = require('../config')
const { loggers } = require('../utils')
const httpStatus = require('http-status')
const logger = loggers.loggerServer

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}`
	return new ApiError(400, message)
}

const handleDuplicateFieldsDB = (err) => {
	let duplicateFields = ''
	Object.keys(err.keyValue).forEach((key) => {
		duplicateFields += `${key}: "${err.keyValue[key]}"`
	})

	const message = `Duplicate field value(s) ${duplicateFields}. Please use another value!`

	return new ApiError(400, message)
}

const handleValidationErrorDB = (err) => {
	const errors = Object.values(err.errors).map((el) => el.message)
	const message = `Invalid input data. ${errors.join('. ')}`

	return new ApiError(400, message)
}

const handleJWTError = () =>
	new ApiError(401, 'Invalid token. Please log in again!')

const handleJWTExpiredError = () =>
	new ApiError(401, 'Your token has expired! Please log in again.')

const sendErrorDev = (err, res) => {
	logger.error('ERROR 💥:', err)

	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	})
}

const sendErrorProd = (err, res) => {
	// Operational, trusted error: sends message to client.
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		})

		// Programming or other unknown error.
	} else {
		// 1) Logs error.
		logger.error('ERROR 💥:', err)

		// 2) Sends generic response.
		res.status(500).json({
			status: 'error',
			message: 'Something went very wrong!',
		})
	}
}

// Custom error handler.
exports.handler = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500
	err.status = err.status || 'error'

	if (nodeEnv === 'production' || nodeEnv === 'test') {
		let error = { ...err }
		error.message = err.message

		if (err.name === 'CastError') error = handleCastErrorDB(err)
		if (err.code === 11000) error = handleDuplicateFieldsDB(err)
		if (err.name === 'ValidationError') error = handleValidationErrorDB(err)
		if (err.name === 'JsonWebTokenError') error = handleJWTError()
		if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()

		sendErrorProd(error, res)
	} else {
		sendErrorDev(err, res)
	}
}

// If the error is not an instanceOf ApiError, convert it.
exports.converter = (err, req, res, next) => {
	let convertedError = err

	if (!(err instanceof ApiError)) {
		convertedError = new ApiError(err.statusCode, err.message)
	}

	return exports.handler(convertedError, req, res)
}

// Catch 404 and forward to error handler.
exports.notFound = (req, res, next) => {
	const statusCode = httpStatus.NOT_FOUND
	const message = `${req.url} Route ${httpStatus['404']}`
	const err = new ApiError(statusCode, message)

	return exports.handler(err, req, res)
}
