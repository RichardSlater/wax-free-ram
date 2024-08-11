import { sub } from "date-fns";

export const atomicBaseUrl = "https://wax.eosusa.io";

export interface AtomicAssetsOffer {
    offerId: string,
    senderName: string,
    recipientName: string,
    memo: string,
}

interface AtomicAssetOfferApiResponse {
    offer_id: string,
    sender_name: string,
    recipient_name: string,
    memo: string,
}

export async function GetPagedOffers(cutoffMinutes: number, account: string, contract: string, limit: number, page: number): Promise<AtomicAssetsOffer[]> {
    // Construct the query URL
    const cutoffTime = sub(new Date(), { minutes: cutoffMinutes }).getTime();
    const queryParams = new URLSearchParams({
        recipient: contract,
        account,
        sender: account,
        state: '0,1,2',
        before: cutoffTime.toString(),
        page: page.toString(),
        limit: limit.toString(),
    });

    const url = `${atomicBaseUrl}/atomicassets/v1/offers?${queryParams}`;

    try {
        // Fetch from the AtomicAssets API
        const apiResponse = await fetch(url);

        // Check if the response is OK (status 200-299)
        if (!apiResponse.ok) {
            throw new Error(`Failed to fetch offers: ${apiResponse.status} ${apiResponse.statusText} (${url})`);
        }

        const { success, data } = await apiResponse.json();

        if (!success) {
            throw new Error('The AtomicAssets api endpoint (/atomicassets/v1/offers) indicates that the request succeeded however the payload was marked as unsucessful, success was set to false.');
        }

        // Check if payload.data is an array before mapping
        if (!Array.isArray(data)) {
            throw new Error('The AtomicAssets api endpoint (/atomicassets/v1/offers) returned an invalid format, expected JSON Array in the data field, but got something else.');
        }

        // Map the API response to the desired format
        return data.map((o: AtomicAssetOfferApiResponse) => ({
            offerId: o.offer_id,
            senderName: o.sender_name,
            recipientName: o.recipient_name,
            memo: o.memo,
        }));
    } catch (error) {
        console.error('Error fetching offers:', error);
        throw error;
    }
}

export async function GetAllOffers(cutoffMinutes: number, account: string, contract: string): Promise<AtomicAssetsOffer[]> {
    const limit = 100;

    let page = 1;
    let allOffers: AtomicAssetsOffer[] = [];

    while (true) {
        // Keep fetching more pages until nothing is returned, AtomicAssets API doesn't provide an indicative count.
        const offersPage = await GetPagedOffers(cutoffMinutes, account, contract, limit, page);

        if (offersPage.length == 0) {
            // We have no more pages, exit the loop and return the array.
            break;
        }

        allOffers = allOffers.concat(offersPage);

        page++;
    }

    return allOffers;
}