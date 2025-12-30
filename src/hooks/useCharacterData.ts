
import { useState, useEffect, useMemo } from "react";
import { getCharacterData } from "@/lib/actions";
import type { CharacterData } from "@/lib/types";

export function useCharacterData(name: string) {
    const [characterDataMap, setCharacterDataMap] = useState(new Map<string, CharacterData>());
    const [isLoading, setIsLoading] = useState(false);

    // Extract unique characters from name
    const uniqueChars = useMemo(() => {
        const cleanedName = name.replace(/\s+/g, '');
        return [...new Set(cleanedName.split(""))];
    }, [name]);

    useEffect(() => {
        const fetchDetails = async () => {
            const newChars = uniqueChars.filter(char => !characterDataMap.has(char));

            if (newChars.length > 0) {
                setIsLoading(true);
                try {
                    const results = await Promise.all(
                        newChars.map(char => getCharacterData(char))
                    );
                    setCharacterDataMap(prevMap => {
                        const newMap = new Map(prevMap);
                        results.forEach((data, index) => {
                            if (data) { // Ensure data is not null
                                // Cast to CharacterData as we know the structure matches
                                newMap.set(newChars[index], data as unknown as CharacterData);
                            }
                        });
                        return newMap;
                    });
                } catch (error) {
                    console.error("Failed to fetch character data:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (uniqueChars.length > 0) {
            fetchDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uniqueChars]);

    return {
        characterDataMap,
        isLoading,
        uniqueChars,
        allCharsLoaded: useMemo(() => {
            if (uniqueChars.length === 0) return true;
            return uniqueChars.every(char => characterDataMap.has(char) && characterDataMap.get(char)?.details);
        }, [uniqueChars, characterDataMap])
    };
}
