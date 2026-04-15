import {useEffect, useState} from "react";
import { client, type Location, type Tag} from "../api";
import {Accessibility, Ear, Eye, Box, type LucideIcon} from "lucide-react";

function makeLocationMap(locations: Location[]) : Map<string,Location> {
    const locMap = new Map<string, Location>();
    for (const loc of locations) {
        locMap.set(loc.name, loc)
    }
    return locMap;
}

function makeTagMap(tags: Tag[]) : Map<string, Tag> {
    const tMap = new Map<string, Tag>();
    for (const tag of tags) {
        tMap.set(tag.name, tag)
    }
    return tMap;

}


export function getTagIcon(tag: Tag) : LucideIcon {
    const name = tag.name.toUpperCase();
    switch (name) {
        case "PHYSICAL" : {
            return Accessibility;
        }
        case "VISUAL" : {
            return Eye;
        }

        case "AUDIAL" : {
            return Ear;
        }

        default: {
            return Box;
        }

    }
}


export default function useDefaultData() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [locationMap, setLocationMap] = useState<Map<string, Location>>(makeLocationMap(locations)); // loc name -> location
    const [tagMap, setTagMap] = useState<Map<string, Tag>>(makeTagMap(tags));


    useEffect(() => {
        setLocationMap(makeLocationMap(locations));
    }, [locations])

    useEffect(() => {
        setTagMap(makeTagMap(tags))
    }, []);



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
        allLocations: locations, allTags: tags, locationMap, tagMap,
    }
}