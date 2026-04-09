import {useEffect, useState} from "react";
import { client, type Location, type Tag} from "../api";

export function useDefaultData() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);



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
        locations, tags
    }
}