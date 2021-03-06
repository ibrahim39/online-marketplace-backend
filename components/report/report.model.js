const { findReportSubject } = require('../../utils/misc')
const listingSubjects = require('./listing-subjects')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSubjects = require('./user-subjects')

const reportSchema = new Schema(
	{
		reporter: { type: String, ref: 'User', required: true },
		reportedListing: { type: String, ref: 'Listing' },
		reportedUser: { type: String, ref: 'User' },
		subject: { type: Number, required: true },
		message: { type: String, maxlength: 300 },
	},
	{
		timestamps: true,
		toJSON: {
			versionKey: false,
			virtuals: true,
			transform: (doc, ret) => {
				delete ret._id
				delete ret.createdAt
				delete ret.updatedAt
				if (doc.reportedListing) {
					ret.subject = findReportSubject(listingSubjects, doc.subject)
				} else {
					ret.subject = findReportSubject(userSubjects, doc.subject)
				}
			},
		},
	}
)

const Report = mongoose.model('Report', reportSchema)

module.exports = Report
