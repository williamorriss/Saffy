import {useEffect, useState} from "react";
import { client, type Location, type Tag} from "../api";

function makeLocationMap(locations: Location[]) : Map<string,Location> {
    const locMap = new Map<string, Location>();
    for (const loc of locations) {
        locMap.set(loc.name, loc)
    }
    return locMap;

}

export function useDefaultData() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [locationMap, setLocationMap] = useState<Map<string, Location>>(makeLocationMap(locations)); // loc name -> location


    useEffect(() => {
        setLocationMap(makeLocationMap(locations));
    }, [locations])



    useEffect(() => {
        const fetchLocations = async () => {
            const { data } = await client.GET("/api/locations", {});
            if (data) {
                setLocations(data);
            }
        }

        const fetchTags = async () => {
            const { data } = await client.GET("/api/tags", {});
            if (data) {
                setTags(data);
            }
        }
        fetchLocations().then();
        fetchTags().then();
    }, [])

    return {
        allLocations: locations, allTags: tags, locationMap: locationMap
    }
}