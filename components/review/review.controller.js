const { APIError } = require('../../helpers')
const service = require('./review.service')

module.exports = {
	async getListingReviews(listingId) {
		if (!listingId) {
			throw new APIError(400, 'You need to provide the listingId.')
		}

		return await service.getListingReviews(listingId)
	},

	async getUserReviews(userId) {
		if (!userId) {
			throw new APIError(400, 'You need to provide the userId.')
		}

		return await service.getUserReviews(userId)
	},

	async publishReview(userId, params) {
		if (!params) {
			throw new APIError(400, 'You need to provide the required parameters.')
		}

		return await service.publishReview(userId, params)
	},
}
